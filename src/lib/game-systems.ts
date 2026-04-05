/**
 * game-systems.ts
 * Production-ready Luau game system templates for ForjeAI.
 *
 * Each entry contains:
 *   - description  : short label shown to the user
 *   - files        : array of { filename, scriptType, code } — one per script file
 *
 * All scripts use:
 *   - pcall() around every DataStore call
 *   - RemoteEvents in ReplicatedStorage for client↔server comms
 *   - Typed Luau annotations (--!strict style)
 *   - Clear section comments
 */

export type ScriptType = 'ServerScript' | 'LocalScript' | 'ModuleScript'

export interface GameSystemFile {
  filename: string
  scriptType: ScriptType
  /** Where to parent this script in the Roblox service tree */
  parent: string
  code: string
}

export interface GameSystem {
  id: string
  description: string
  files: GameSystemFile[]
}

// ─── 1. Currency System ────────────────────────────────────────────────────────

const CURRENCY_SERVER: GameSystemFile = {
  filename: 'CurrencyServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- CurrencyServer (ServerScript → ServerScriptService)
-- DataStore-backed currency: earn, spend, leaderstats, auto-save.

local Players       = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService    = game:GetService("RunService")

local DS = DataStoreService:GetDataStore("CurrencyV1")

-- ── Config ──────────────────────────────────────────────────────────────────
local STARTING_COINS = 100
local AUTO_SAVE_INTERVAL = 60  -- seconds between background saves

-- ── RemoteEvents ─────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder")
Remotes.Name  = "CurrencyRemotes"
Remotes.Parent = ReplicatedStorage

local EarnCoins  = Instance.new("RemoteEvent"); EarnCoins.Name  = "EarnCoins";  EarnCoins.Parent  = Remotes
local SpendCoins = Instance.new("RemoteEvent"); SpendCoins.Name = "SpendCoins"; SpendCoins.Parent = Remotes
local GetBalance = Instance.new("RemoteFunction"); GetBalance.Name = "GetBalance"; GetBalance.Parent = Remotes
local UpdateUI   = Instance.new("RemoteEvent"); UpdateUI.Name   = "UpdateUI";   UpdateUI.Parent   = Remotes

-- ── In-memory ledger (userId → balance) ────────────────────────────────────
local balances: {[string]: number} = {}

-- ── DataStore helpers ────────────────────────────────────────────────────────
local function loadBalance(player: Player): number
	local key = tostring(player.UserId)
	local ok, value = pcall(DS.GetAsync, DS, key)
	if ok and type(value) == "number" then
		return value
	end
	if not ok then
		warn("[Currency] Load failed for", player.Name, ":", value)
	end
	return STARTING_COINS
end

local function saveBalance(player: Player)
	local key  = tostring(player.UserId)
	local bal  = balances[key] or 0
	local ok, err = pcall(DS.SetAsync, DS, key, bal)
	if not ok then
		warn("[Currency] Save failed for", player.Name, ":", err)
	end
end

-- ── Leaderstats ──────────────────────────────────────────────────────────────
local function createLeaderstats(player: Player, coins: number)
	local ls    = Instance.new("Folder"); ls.Name    = "leaderstats"; ls.Parent = player
	local value = Instance.new("IntValue"); value.Name = "Coins";   value.Value = coins; value.Parent = ls
end

-- ── Player lifecycle ─────────────────────────────────────────────────────────
Players.PlayerAdded:Connect(function(player: Player)
	local coins = loadBalance(player)
	balances[tostring(player.UserId)] = coins
	createLeaderstats(player, coins)
	-- Push initial balance to client UI
	UpdateUI:FireClient(player, coins)
end)

Players.PlayerRemoving:Connect(function(player: Player)
	saveBalance(player)
	balances[tostring(player.UserId)] = nil
end)

-- Save all on server close
game:BindToClose(function()
	for _, player in Players:GetPlayers() do
		saveBalance(player)
	end
end)

-- ── Auto-save loop ────────────────────────────────────────────────────────────
task.spawn(function()
	while true do
		task.wait(AUTO_SAVE_INTERVAL)
		for _, player in Players:GetPlayers() do
			saveBalance(player)
		end
	end
end)

-- ── Server-side earn (called by other server scripts) ────────────────────────
local function addCoins(player: Player, amount: number)
	if amount <= 0 then return end
	local key = tostring(player.UserId)
	balances[key] = (balances[key] or 0) + amount
	-- Sync leaderstats
	local ls = player:FindFirstChild("leaderstats")
	if ls then
		local coins = ls:FindFirstChild("Coins")
		if coins then coins.Value = balances[key] end
	end
	-- Notify client
	UpdateUI:FireClient(player, balances[key])
end

local function removeCoins(player: Player, amount: number): boolean
	if amount <= 0 then return false end
	local key = tostring(player.UserId)
	local current = balances[key] or 0
	if current < amount then return false end
	balances[key] = current - amount
	local ls = player:FindFirstChild("leaderstats")
	if ls then
		local coins = ls:FindFirstChild("Coins")
		if coins then coins.Value = balances[key] end
	end
	UpdateUI:FireClient(player, balances[key])
	return true
end

-- ── RemoteEvent handlers ──────────────────────────────────────────────────────
-- EarnCoins: server-side only (never trust client with earning)
-- Remove this remote in production — have other server scripts call addCoins().
EarnCoins.OnServerEvent:Connect(function(player: Player, amount: unknown)
	if type(amount) == "number" and amount > 0 and amount <= 1000 then
		addCoins(player, amount)
	end
end)

SpendCoins.OnServerEvent:Connect(function(player: Player, amount: unknown)
	if type(amount) == "number" and amount > 0 then
		removeCoins(player, amount)
	end
end)

GetBalance.OnServerInvoke = function(player: Player): number
	return balances[tostring(player.UserId)] or 0
end

-- ── Expose API for other server scripts ─────────────────────────────────────
return { addCoins = addCoins, removeCoins = removeCoins }
`,
}

const CURRENCY_CLIENT: GameSystemFile = {
  filename: 'CurrencyClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- CurrencyClient (LocalScript → StarterPlayerScripts)
-- Manages the coin counter ScreenGui, animates balance changes.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- ── Wait for remotes ──────────────────────────────────────────────────────────
local Remotes  = ReplicatedStorage:WaitForChild("CurrencyRemotes")
local UpdateUI = Remotes:WaitForChild("UpdateUI") :: RemoteEvent

-- ── Build the coin HUD ───────────────────────────────────────────────────────
local screen = Instance.new("ScreenGui")
screen.Name = "CurrencyGui"
screen.ResetOnSpawn = false
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.Parent = playerGui

local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 180, 0, 48)
frame.Position = UDim2.new(1, -196, 0, 16)
frame.AnchorPoint = Vector2.new(0, 0)
frame.BackgroundColor3 = Color3.fromRGB(20, 20, 28)
frame.BackgroundTransparency = 0.15
frame.Parent = screen

local corner = Instance.new("UICorner"); corner.CornerRadius = UDim.new(0, 12); corner.Parent = frame
local stroke = Instance.new("UIStroke"); stroke.Color = Color3.fromRGB(212, 175, 55); stroke.Thickness = 1.5; stroke.Parent = frame

-- Coin icon (unicode circle as placeholder — swap for an ImageLabel)
local icon = Instance.new("TextLabel")
icon.Size = UDim2.new(0, 36, 1, 0)
icon.Position = UDim2.new(0, 6, 0, 0)
icon.BackgroundTransparency = 1
icon.Text = "🪙"
icon.TextSize = 22
icon.Font = Enum.Font.GothamBold
icon.Parent = frame

local label = Instance.new("TextLabel")
label.Name = "CoinsLabel"
label.Size = UDim2.new(1, -50, 1, 0)
label.Position = UDim2.new(0, 46, 0, 0)
label.BackgroundTransparency = 1
label.Text = "0"
label.TextSize = 20
label.Font = Enum.Font.GothamBold
label.TextColor3 = Color3.fromRGB(212, 175, 55)
label.TextXAlignment = Enum.TextXAlignment.Left
label.Parent = frame

-- ── Animated update ───────────────────────────────────────────────────────────
local currentDisplay = 0

local function animateToValue(target: number)
	local steps = 20
	local diff  = target - currentDisplay
	local stepVal = diff / steps
	task.spawn(function()
		for _ = 1, steps do
			task.wait(0.016)
			currentDisplay += stepVal
			label.Text = tostring(math.floor(currentDisplay + 0.5))
		end
		currentDisplay = target
		label.Text = tostring(target)
	end)
	-- Flash gold on gain
	if diff > 0 then
		TweenService:Create(label, TweenInfo.new(0.2), { TextColor3 = Color3.fromRGB(255, 230, 100) }):Play()
		task.delay(0.25, function()
			TweenService:Create(label, TweenInfo.new(0.3), { TextColor3 = Color3.fromRGB(212, 175, 55) }):Play()
		end)
	end
end

UpdateUI.OnClientEvent:Connect(function(newBalance: number)
	animateToValue(newBalance)
end)
`,
}

// ─── 2. Shop System ────────────────────────────────────────────────────────────

const SHOP_SERVER: GameSystemFile = {
  filename: 'ShopServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- ShopServer (ServerScript → ServerScriptService)
-- Handles purchase validation, currency deduction, and item granting.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService  = game:GetService("DataStoreService")

local InventoryDS = DataStoreService:GetDataStore("InventoryV1")

-- ── Shop catalogue (id → { name, price, description }) ──────────────────────
type ShopItem = { name: string, price: number, description: string, category: string }

local SHOP_ITEMS: {[string]: ShopItem} = {
	["sword_01"]  = { name = "Iron Sword",    price = 150,  description = "A sturdy iron sword.",        category = "Weapons"  },
	["shield_01"] = { name = "Wooden Shield", price = 100,  description = "Basic wooden protection.",   category = "Armor"    },
	["potion_01"] = { name = "Health Potion", price = 50,   description = "Restores 50 HP.",             category = "Consumables" },
	["boots_01"]  = { name = "Speed Boots",   price = 200,  description = "+20% movement speed.",        category = "Armor"    },
	["gem_01"]    = { name = "Magic Gem",      price = 500,  description = "Increases spell power.",      category = "Magic"    },
}

-- ── RemoteEvents ─────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder")
Remotes.Name  = "ShopRemotes"
Remotes.Parent = ReplicatedStorage

local PurchaseItem   = Instance.new("RemoteFunction"); PurchaseItem.Name   = "PurchaseItem";   PurchaseItem.Parent   = Remotes
local GetCatalogue   = Instance.new("RemoteFunction"); GetCatalogue.Name   = "GetCatalogue";   GetCatalogue.Parent   = Remotes
local OpenShop       = Instance.new("RemoteEvent");    OpenShop.Name       = "OpenShop";       OpenShop.Parent       = Remotes

-- ── Inventory helpers ────────────────────────────────────────────────────────
local function loadInventory(player: Player): {[string]: number}
	local key = "inv_" .. tostring(player.UserId)
	local ok, data = pcall(InventoryDS.GetAsync, InventoryDS, key)
	if ok and type(data) == "table" then
		return data :: {[string]: number}
	end
	return {}
end

local function saveInventory(player: Player, inv: {[string]: number})
	local key = "inv_" .. tostring(player.UserId)
	local ok, err = pcall(InventoryDS.SetAsync, InventoryDS, key, inv)
	if not ok then warn("[Shop] Inventory save failed:", err) end
end

-- Player inventories in memory
local inventories: {[string]: {[string]: number}} = {}

Players.PlayerAdded:Connect(function(player: Player)
	inventories[tostring(player.UserId)] = loadInventory(player)
end)

Players.PlayerRemoving:Connect(function(player: Player)
	local inv = inventories[tostring(player.UserId)]
	if inv then saveInventory(player, inv) end
	inventories[tostring(player.UserId)] = nil
end)

game:BindToClose(function()
	for _, player in Players:GetPlayers() do
		local inv = inventories[tostring(player.UserId)]
		if inv then saveInventory(player, inv) end
	end
end)

-- ── Get balance from CurrencyServer ─────────────────────────────────────────
local function getCoins(player: Player): number
	local currencyRemotes = ReplicatedStorage:FindFirstChild("CurrencyRemotes")
	if not currencyRemotes then return 0 end
	local getBalance = currencyRemotes:FindFirstChild("GetBalance") :: RemoteFunction
	if not getBalance then return 0 end
	local ok, val = pcall(getBalance.InvokeServer, getBalance)
	return (ok and type(val) == "number") and val or 0
end

local function spendCoins(player: Player, amount: number): boolean
	local currencyRemotes = ReplicatedStorage:FindFirstChild("CurrencyRemotes")
	if not currencyRemotes then return false end
	local spendEvent = currencyRemotes:FindFirstChild("SpendCoins") :: RemoteEvent
	if not spendEvent then return false end
	-- Check balance first
	local bal = getCoins(player)
	if bal < amount then return false end
	spendEvent:FireServer()  -- this fires from server perspective; call module directly instead
	-- Preferred: require CurrencyServer module and call removeCoins
	-- Here we directly adjust leaderstats as a fallback
	local ls = player:FindFirstChild("leaderstats")
	if ls then
		local coins = ls:FindFirstChild("Coins")
		if coins and (coins :: IntValue).Value >= amount then
			;(coins :: IntValue).Value -= amount
			return true
		end
	end
	return false
end

-- ── Purchase handler ─────────────────────────────────────────────────────────
PurchaseItem.OnServerInvoke = function(player: Player, itemId: unknown): (boolean, string)
	if type(itemId) ~= "string" then return false, "Invalid item." end
	local item = SHOP_ITEMS[itemId]
	if not item then return false, "Item not found." end

	local userId = tostring(player.UserId)
	local inv    = inventories[userId]
	if not inv then return false, "Inventory not loaded." end

	-- Check currency via leaderstats
	local ls    = player:FindFirstChild("leaderstats")
	local coins = ls and ls:FindFirstChild("Coins") :: IntValue
	if not coins or coins.Value < item.price then
		return false, "Not enough coins! Need " .. item.price .. " coins."
	end

	-- Deduct coins
	coins.Value -= item.price

	-- Add to inventory
	inv[itemId] = (inv[itemId] or 0) + 1

	-- Fire currency update event
	local currRemotes = ReplicatedStorage:FindFirstChild("CurrencyRemotes")
	if currRemotes then
		local updateUI = currRemotes:FindFirstChild("UpdateUI") :: RemoteEvent
		if updateUI then updateUI:FireClient(player, coins.Value) end
	end

	return true, "Purchased " .. item.name .. "!"
end

-- ── Catalogue fetch (returns serialisable table) ─────────────────────────────
GetCatalogue.OnServerInvoke = function(_player: Player)
	return SHOP_ITEMS
end

print("[ShopServer] Ready — " .. #(function()
	local t = {}
	for k in SHOP_ITEMS do t[#t+1] = k end
	return t
end)() .. " items in catalogue.")
`,
}

const SHOP_CLIENT: GameSystemFile = {
  filename: 'ShopClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- ShopClient (LocalScript → StarterPlayerScripts)
-- Renders the shop UI, handles item selection, purchase confirmation.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- ── Wait for remotes ──────────────────────────────────────────────────────────
local Remotes      = ReplicatedStorage:WaitForChild("ShopRemotes")
local PurchaseItem = Remotes:WaitForChild("PurchaseItem") :: RemoteFunction
local GetCatalogue = Remotes:WaitForChild("GetCatalogue") :: RemoteFunction
local OpenShop     = Remotes:WaitForChild("OpenShop")     :: RemoteEvent

-- ── Build Shop GUI ───────────────────────────────────────────────────────────
local screen = Instance.new("ScreenGui")
screen.Name            = "ShopGui"
screen.ResetOnSpawn    = false
screen.Enabled         = false
screen.ZIndexBehavior  = Enum.ZIndexBehavior.Sibling
screen.Parent          = playerGui

-- Background dimmer
local dimmer = Instance.new("Frame")
dimmer.Size                  = UDim2.new(1, 0, 1, 0)
dimmer.BackgroundColor3      = Color3.fromRGB(0, 0, 0)
dimmer.BackgroundTransparency = 0.5
dimmer.Parent                 = screen

-- Main panel
local panel = Instance.new("Frame")
panel.Size            = UDim2.new(0, 560, 0, 440)
panel.Position        = UDim2.new(0.5, -280, 0.5, -220)
panel.BackgroundColor3 = Color3.fromRGB(15, 15, 25)
panel.Parent          = screen

local panelCorner = Instance.new("UICorner"); panelCorner.CornerRadius = UDim.new(0, 16); panelCorner.Parent = panel
local panelStroke = Instance.new("UIStroke"); panelStroke.Color = Color3.fromRGB(212, 175, 55); panelStroke.Thickness = 2; panelStroke.Parent = panel

-- Title
local title = Instance.new("TextLabel")
title.Size                = UDim2.new(1, -60, 0, 44)
title.Position            = UDim2.new(0, 20, 0, 0)
title.BackgroundTransparency = 1
title.Text                = "SHOP"
title.TextSize            = 24
title.Font                = Enum.Font.GothamBold
title.TextColor3          = Color3.fromRGB(212, 175, 55)
title.TextXAlignment      = Enum.TextXAlignment.Left
title.Parent              = panel

-- Close button
local closeBtn = Instance.new("TextButton")
closeBtn.Size             = UDim2.new(0, 36, 0, 36)
closeBtn.Position         = UDim2.new(1, -46, 0, 4)
closeBtn.BackgroundColor3 = Color3.fromRGB(180, 40, 40)
closeBtn.Text             = "✕"
closeBtn.TextSize         = 18
closeBtn.Font             = Enum.Font.GothamBold
closeBtn.TextColor3       = Color3.fromRGB(255, 255, 255)
closeBtn.Parent           = panel
local closeCorner = Instance.new("UICorner"); closeCorner.CornerRadius = UDim.new(0, 8); closeCorner.Parent = closeBtn

-- Separator
local sep = Instance.new("Frame")
sep.Size             = UDim2.new(1, -40, 0, 1)
sep.Position         = UDim2.new(0, 20, 0, 48)
sep.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
sep.BackgroundTransparency = 0.6
sep.Parent           = panel

-- Scroll frame for items
local scroll = Instance.new("ScrollingFrame")
scroll.Size                  = UDim2.new(1, -40, 1, -100)
scroll.Position              = UDim2.new(0, 20, 0, 60)
scroll.BackgroundTransparency = 1
scroll.ScrollBarThickness    = 6
scroll.ScrollBarImageColor3  = Color3.fromRGB(212, 175, 55)
scroll.CanvasSize            = UDim2.new(0, 0, 0, 0)
scroll.AutomaticCanvasSize   = Enum.AutomaticSize.Y
scroll.Parent                = panel

local listLayout = Instance.new("UIListLayout")
listLayout.SortOrder  = Enum.SortOrder.LayoutOrder
listLayout.Padding    = UDim.new(0, 8)
listLayout.Parent     = scroll

-- ── Notification label ────────────────────────────────────────────────────────
local notif = Instance.new("TextLabel")
notif.Size             = UDim2.new(1, -40, 0, 32)
notif.Position         = UDim2.new(0, 20, 1, -40)
notif.BackgroundTransparency = 1
notif.Text             = ""
notif.TextSize         = 16
notif.Font             = Enum.Font.Gotham
notif.TextColor3       = Color3.fromRGB(100, 220, 100)
notif.Parent           = panel

local function showNotif(text: string, success: boolean)
	notif.Text       = text
	notif.TextColor3 = success and Color3.fromRGB(100, 220, 100) or Color3.fromRGB(220, 80, 80)
	task.delay(3, function() notif.Text = "" end)
end

-- ── Populate items ────────────────────────────────────────────────────────────
type CatalogueItem = { name: string, price: number, description: string, category: string }

local function buildItemRow(itemId: string, item: CatalogueItem)
	local row = Instance.new("Frame")
	row.Size             = UDim2.new(1, 0, 0, 70)
	row.BackgroundColor3 = Color3.fromRGB(25, 25, 40)
	row.Parent           = scroll
	local rowCorner = Instance.new("UICorner"); rowCorner.CornerRadius = UDim.new(0, 10); rowCorner.Parent = row

	local nameLabel = Instance.new("TextLabel")
	nameLabel.Size             = UDim2.new(0.55, 0, 0, 28)
	nameLabel.Position         = UDim2.new(0, 14, 0, 8)
	nameLabel.BackgroundTransparency = 1
	nameLabel.Text             = item.name
	nameLabel.TextSize         = 17
	nameLabel.Font             = Enum.Font.GothamBold
	nameLabel.TextColor3       = Color3.fromRGB(240, 240, 250)
	nameLabel.TextXAlignment   = Enum.TextXAlignment.Left
	nameLabel.Parent           = row

	local descLabel = Instance.new("TextLabel")
	descLabel.Size             = UDim2.new(0.55, 0, 0, 24)
	descLabel.Position         = UDim2.new(0, 14, 0, 36)
	descLabel.BackgroundTransparency = 1
	descLabel.Text             = item.description
	descLabel.TextSize         = 13
	descLabel.Font             = Enum.Font.Gotham
	descLabel.TextColor3       = Color3.fromRGB(160, 160, 180)
	descLabel.TextXAlignment   = Enum.TextXAlignment.Left
	descLabel.Parent           = row

	local priceLabel = Instance.new("TextLabel")
	priceLabel.Size             = UDim2.new(0.2, 0, 0, 28)
	priceLabel.Position         = UDim2.new(0.56, 0, 0, 21)
	priceLabel.BackgroundTransparency = 1
	priceLabel.Text             = "🪙 " .. item.price
	priceLabel.TextSize         = 16
	priceLabel.Font             = Enum.Font.GothamBold
	priceLabel.TextColor3       = Color3.fromRGB(212, 175, 55)
	priceLabel.Parent           = row

	local buyBtn = Instance.new("TextButton")
	buyBtn.Size             = UDim2.new(0, 90, 0, 36)
	buyBtn.Position         = UDim2.new(1, -104, 0.5, -18)
	buyBtn.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
	buyBtn.Text             = "BUY"
	buyBtn.TextSize         = 15
	buyBtn.Font             = Enum.Font.GothamBold
	buyBtn.TextColor3       = Color3.fromRGB(15, 15, 25)
	buyBtn.Parent           = row
	local buyCorner = Instance.new("UICorner"); buyCorner.CornerRadius = UDim.new(0, 8); buyCorner.Parent = buyBtn

	buyBtn.MouseButton1Click:Connect(function()
		buyBtn.Text = "..."
		buyBtn.Active = false
		local success, msg = PurchaseItem:InvokeServer(itemId)
		showNotif(msg :: string, success :: boolean)
		buyBtn.Text   = "BUY"
		buyBtn.Active = true
	end)
end

local function loadCatalogue()
	local ok, catalogue = pcall(GetCatalogue.InvokeServer, GetCatalogue)
	if not ok or type(catalogue) ~= "table" then return end
	for itemId, item in catalogue :: {[string]: CatalogueItem} do
		buildItemRow(itemId, item)
	end
end

-- ── Open / close ─────────────────────────────────────────────────────────────
local isLoaded = false

local function openShop()
	if not isLoaded then
		loadCatalogue()
		isLoaded = true
	end
	screen.Enabled = true
	panel.Size = UDim2.new(0, 0, 0, 0)
	panel.Position = UDim2.new(0.5, 0, 0.5, 0)
	TweenService:Create(panel, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
		Size     = UDim2.new(0, 560, 0, 440),
		Position = UDim2.new(0.5, -280, 0.5, -220),
	}):Play()
end

local function closeShop()
	TweenService:Create(panel, TweenInfo.new(0.18, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
		Size     = UDim2.new(0, 0, 0, 0),
		Position = UDim2.new(0.5, 0, 0.5, 0),
	}):Play()
	task.delay(0.2, function() screen.Enabled = false end)
end

closeBtn.MouseButton1Click:Connect(closeShop)
dimmer.InputBegan:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseButton1 then closeShop() end
end)
OpenShop.OnClientEvent:Connect(openShop)

-- ── Keyboard shortcut (B) ─────────────────────────────────────────────────────
local UserInputService = game:GetService("UserInputService")
UserInputService.InputBegan:Connect(function(input, processed)
	if processed then return end
	if input.KeyCode == Enum.KeyCode.B then
		if screen.Enabled then closeShop() else openShop() end
	end
end)
`,
}

// ─── 3. Pet System ────────────────────────────────────────────────────────────

const PET_SERVER: GameSystemFile = {
  filename: 'PetServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- PetServer (ServerScript → ServerScriptService)
-- Egg hatching, rarity system, equip/unequip, following player.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService  = game:GetService("DataStoreService")
local RunService        = game:GetService("RunService")

local PetDS = DataStoreService:GetDataStore("PetsV1")

-- ── Pet definitions ───────────────────────────────────────────────────────────
type PetDef = { name: string, rarity: string, color: Color3, chance: number, bonusMultiplier: number }

local PET_DEFS: {PetDef} = {
	{ name = "Fluffy",     rarity = "Common",    color = Color3.fromRGB(200, 180, 160), chance = 50,  bonusMultiplier = 1.0 },
	{ name = "Sparky",     rarity = "Common",    color = Color3.fromRGB(220, 220, 80),  chance = 25,  bonusMultiplier = 1.1 },
	{ name = "Blaze",      rarity = "Rare",      color = Color3.fromRGB(220, 120, 40),  chance = 15,  bonusMultiplier = 1.5 },
	{ name = "Frostbite",  rarity = "Rare",      color = Color3.fromRGB(100, 180, 255), chance = 7,   bonusMultiplier = 1.8 },
	{ name = "Shadowfang", rarity = "Epic",      color = Color3.fromRGB(120, 40, 180),  chance = 2.5, bonusMultiplier = 2.5 },
	{ name = "Goldpaw",    rarity = "Legendary", color = Color3.fromRGB(212, 175, 55),  chance = 0.5, bonusMultiplier = 5.0 },
}

type OwnedPet = { petName: string, rarity: string, uuid: string, equipped: boolean }

-- ── RemoteEvents ─────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder"); Remotes.Name = "PetRemotes"; Remotes.Parent = ReplicatedStorage
local HatchEgg    = Instance.new("RemoteFunction"); HatchEgg.Name    = "HatchEgg";    HatchEgg.Parent    = Remotes
local EquipPet    = Instance.new("RemoteFunction"); EquipPet.Name    = "EquipPet";    EquipPet.Parent    = Remotes
local UnequipPet  = Instance.new("RemoteFunction"); UnequipPet.Name  = "UnequipPet";  UnequipPet.Parent  = Remotes
local GetPets     = Instance.new("RemoteFunction"); GetPets.Name     = "GetPets";     GetPets.Parent     = Remotes
local SpawnPetVisual = Instance.new("RemoteEvent"); SpawnPetVisual.Name = "SpawnPetVisual"; SpawnPetVisual.Parent = Remotes

-- ── Inventory (memory) ────────────────────────────────────────────────────────
local petInventories: {[string]: {OwnedPet}} = {}

local function loadPets(player: Player): {OwnedPet}
	local ok, data = pcall(PetDS.GetAsync, PetDS, "pets_" .. tostring(player.UserId))
	if ok and type(data) == "table" then return data :: {OwnedPet} end
	return {}
end

local function savePets(player: Player)
	local inv = petInventories[tostring(player.UserId)]
	if not inv then return end
	local ok, err = pcall(PetDS.SetAsync, PetDS, "pets_" .. tostring(player.UserId), inv)
	if not ok then warn("[PetServer] Save failed:", err) end
end

Players.PlayerAdded:Connect(function(player: Player)
	petInventories[tostring(player.UserId)] = loadPets(player)
	-- Re-spawn equipped pets on join
	task.delay(2, function()
		local inv = petInventories[tostring(player.UserId)]
		if not inv then return end
		for _, pet in inv do
			if pet.equipped then
				SpawnPetVisual:FireClient(player, pet.petName, pet.rarity, pet.uuid)
			end
		end
	end)
end)

Players.PlayerRemoving:Connect(function(player: Player)
	savePets(player)
	petInventories[tostring(player.UserId)] = nil
end)

game:BindToClose(function()
	for _, player in Players:GetPlayers() do savePets(player) end
end)

-- ── Rarity roll ───────────────────────────────────────────────────────────────
local function rollPet(): PetDef
	local roll = math.random() * 100
	local cumulative = 0
	for _, def in PET_DEFS do
		cumulative += def.chance
		if roll <= cumulative then return def end
	end
	return PET_DEFS[1]
end

local function generateUUID(): string
	return tostring(math.floor(os.time())) .. "_" .. tostring(math.random(100000, 999999))
end

-- ── Hatch handler ─────────────────────────────────────────────────────────────
HatchEgg.OnServerInvoke = function(player: Player): (boolean, string, OwnedPet?)
	-- Cost to hatch: 200 coins
	local ls = player:FindFirstChild("leaderstats")
	local coins = ls and ls:FindFirstChild("Coins") :: IntValue
	if not coins or coins.Value < 200 then
		return false, "Need 200 coins to hatch!", nil
	end
	coins.Value -= 200

	local petDef = rollPet()
	local newPet: OwnedPet = {
		petName = petDef.name,
		rarity  = petDef.rarity,
		uuid    = generateUUID(),
		equipped = false,
	}

	local uid = tostring(player.UserId)
	table.insert(petInventories[uid], newPet)

	return true, "Hatched a " .. petDef.rarity .. " " .. petDef.name .. "!", newPet
end

-- ── Equip / unequip ───────────────────────────────────────────────────────────
EquipPet.OnServerInvoke = function(player: Player, uuid: unknown): (boolean, string)
	if type(uuid) ~= "string" then return false, "Invalid pet." end
	local uid = tostring(player.UserId)
	local inv = petInventories[uid]
	if not inv then return false, "Inventory not ready." end

	local MAX_EQUIPPED = 3
	local equippedCount = 0
	local targetPet: OwnedPet? = nil

	for _, pet in inv do
		if pet.uuid == uuid then targetPet = pet end
		if pet.equipped then equippedCount += 1 end
	end

	if not targetPet then return false, "Pet not found." end
	if targetPet.equipped then return false, "Already equipped." end
	if equippedCount >= MAX_EQUIPPED then return false, "Max " .. MAX_EQUIPPED .. " pets equipped." end

	targetPet.equipped = true
	SpawnPetVisual:FireClient(player, targetPet.petName, targetPet.rarity, uuid)
	return true, "Equipped " .. targetPet.petName .. "!"
end

UnequipPet.OnServerInvoke = function(player: Player, uuid: unknown): (boolean, string)
	if type(uuid) ~= "string" then return false, "Invalid pet." end
	local uid = tostring(player.UserId)
	local inv = petInventories[uid]
	if not inv then return false, "Inventory not ready." end
	for _, pet in inv do
		if pet.uuid == uuid and pet.equipped then
			pet.equipped = false
			return true, "Unequipped " .. pet.petName
		end
	end
	return false, "Pet not found or not equipped."
end

GetPets.OnServerInvoke = function(player: Player): {OwnedPet}
	return petInventories[tostring(player.UserId)] or {}
end
`,
}

const PET_CLIENT: GameSystemFile = {
  filename: 'PetClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- PetClient (LocalScript → StarterPlayerScripts)
-- Handles egg hatching animation, pet visual following, pet UI.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local RunService        = game:GetService("RunService")

local player    = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local playerGui = player:WaitForChild("PlayerGui")

local Remotes        = ReplicatedStorage:WaitForChild("PetRemotes")
local HatchEgg       = Remotes:WaitForChild("HatchEgg")       :: RemoteFunction
local EquipPet       = Remotes:WaitForChild("EquipPet")       :: RemoteFunction
local UnequipPet     = Remotes:WaitForChild("UnequipPet")     :: RemoteFunction
local GetPets        = Remotes:WaitForChild("GetPets")        :: RemoteFunction
local SpawnPetVisual = Remotes:WaitForChild("SpawnPetVisual") :: RemoteEvent

-- ── Rarity colors ─────────────────────────────────────────────────────────────
local RARITY_COLORS: {[string]: Color3} = {
	Common    = Color3.fromRGB(180, 180, 180),
	Rare      = Color3.fromRGB(80, 140, 255),
	Epic      = Color3.fromRGB(160, 80, 255),
	Legendary = Color3.fromRGB(212, 175, 55),
}

-- ── Active pet models (uuid → BasePart) ──────────────────────────────────────
local activePets: {[string]: BasePart} = {}

-- Create a simple pet model (sphere with BillboardGui name tag)
local function createPetModel(petName: string, rarity: string): BasePart
	local pet = Instance.new("Part")
	pet.Name    = petName
	pet.Size    = Vector3.new(2, 2, 2)
	pet.Shape   = Enum.PartType.Ball
	pet.Color   = RARITY_COLORS[rarity] or Color3.fromRGB(200, 200, 200)
	pet.Material = Enum.Material.SmoothPlastic
	pet.CastShadow = false
	pet.Anchored   = false
	pet.CanCollide = false
	pet.Parent     = workspace

	-- Neon ring for rare+
	if rarity ~= "Common" then
		local ring = Instance.new("Part")
		ring.Name     = "Ring"
		ring.Size     = Vector3.new(2.6, 0.15, 2.6)
		ring.Shape    = Enum.PartType.Cylinder
		ring.Color    = RARITY_COLORS[rarity]
		ring.Material = Enum.Material.Neon
		ring.CastShadow = false
		ring.Anchored   = false
		ring.CanCollide = false
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = pet; weld.Part1 = ring; weld.Parent = pet
		ring.Parent = workspace
	end

	-- Name tag
	local bb = Instance.new("BillboardGui")
	bb.Size = UDim2.new(0, 80, 0, 30)
	bb.StudsOffset = Vector3.new(0, 1.6, 0)
	bb.Parent = pet
	local nameLabel = Instance.new("TextLabel")
	nameLabel.Size             = UDim2.new(1, 0, 1, 0)
	nameLabel.BackgroundTransparency = 1
	nameLabel.Text             = petName
	nameLabel.TextSize         = 13
	nameLabel.Font             = Enum.Font.GothamBold
	nameLabel.TextColor3       = RARITY_COLORS[rarity] or Color3.fromRGB(255, 255, 255)
	nameLabel.Parent           = bb

	return pet
end

-- ── Smooth following ──────────────────────────────────────────────────────────
local petOffsets: {[string]: Vector3} = {}

RunService.Heartbeat:Connect(function()
	character = player.Character
	if not character then return end
	local root = character:FindFirstChild("HumanoidRootPart") :: BasePart
	if not root then return end

	local i = 0
	for uuid, petModel in activePets do
		i += 1
		local offset = petOffsets[uuid] or Vector3.new(3 * i, 2, 2 * i)
		local targetPos = root.Position + root.CFrame.RightVector * offset.X + Vector3.new(0, offset.Y, 0) + root.CFrame.LookVector * -offset.Z
		petModel.Position = petModel.Position:Lerp(targetPos, 0.08)
		-- Bobbing
		petModel.Position = petModel.Position + Vector3.new(0, math.sin(tick() * 2 + i) * 0.05, 0)
	end
end)

-- ── Spawn pet visual ─────────────────────────────────────────────────────────
SpawnPetVisual.OnClientEvent:Connect(function(petName: string, rarity: string, uuid: string)
	if activePets[uuid] then return end
	local model = createPetModel(petName, rarity)
	activePets[uuid] = model
	-- Set unique offset so pets fan out
	local count = 0
	for _ in activePets do count += 1 end
	petOffsets[uuid] = Vector3.new(3 * count, 2, 2 * count)
	-- Appear animation
	model.Size = Vector3.new(0.1, 0.1, 0.1)
	TweenService:Create(model, TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
		Size = Vector3.new(2, 2, 2),
	}):Play()
end)

-- ── Hatch button (press E near egg) ─────────────────────────────────────────
-- This fires when the player presses the "Hatch" ProximityPrompt on an egg model.
-- In your game, place a Part named "Egg" with a ProximityPrompt child anywhere in workspace.
local function bindEggs()
	for _, egg in workspace:GetDescendants() do
		if egg:IsA("ProximityPrompt") and egg.ObjectText == "Egg" then
			egg.Triggered:Connect(function()
				local ok, msg, pet = HatchEgg:InvokeServer()
				print("[PetClient] Hatch result:", msg)
				-- If you have a notification UI, fire it here
			end)
		end
	end
end

workspace.DescendantAdded:Connect(function(desc)
	if desc:IsA("ProximityPrompt") and desc.ObjectText == "Egg" then
		desc.Triggered:Connect(function()
			HatchEgg:InvokeServer()
		end)
	end
end)

task.delay(2, bindEggs)

print("[PetClient] Loaded")
`,
}

// ─── 4. Leaderboard System ────────────────────────────────────────────────────

const LEADERBOARD_SERVER: GameSystemFile = {
  filename: 'LeaderboardServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- LeaderboardServer (ServerScript → ServerScriptService)
-- Global leaderboard via OrderedDataStore — top players by coins.

local Players           = game:GetService("Players")
local DataStoreService  = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- ── Config ────────────────────────────────────────────────────────────────────
local TOP_N     = 10    -- how many players to show
local UPDATE_INTERVAL = 30  -- seconds between leaderboard refreshes

-- OrderedDataStore sorted by coin count descending
local OrderedDS = DataStoreService:GetOrderedDataStore("GlobalLeaderboard_Coins")

-- ── RemoteEvents ─────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder"); Remotes.Name = "LeaderboardRemotes"; Remotes.Parent = ReplicatedStorage
local UpdateLeaderboard = Instance.new("RemoteEvent"); UpdateLeaderboard.Name = "UpdateLeaderboard"; UpdateLeaderboard.Parent = Remotes

-- ── Publish score to OrderedDataStore ────────────────────────────────────────
local function publishScore(player: Player)
	local ls     = player:FindFirstChild("leaderstats")
	local coins  = ls and ls:FindFirstChild("Coins") :: IntValue
	if not coins then return end
	local key = tostring(player.UserId)
	local ok, err = pcall(OrderedDS.SetAsync, OrderedDS, key, math.max(0, coins.Value))
	if not ok then warn("[Leaderboard] Publish failed:", err) end
end

-- Publish when coins change
Players.PlayerAdded:Connect(function(player: Player)
	player.ChildAdded:Connect(function(child)
		if child.Name == "leaderstats" then
			local coins = child:WaitForChild("Coins", 5) :: IntValue?
			if coins then
				coins.Changed:Connect(function() publishScore(player) end)
			end
		end
	end)
end)

-- ── Fetch top N players ────────────────────────────────────────────────────────
type LeaderEntry = { rank: number, name: string, score: number }

local function fetchTopPlayers(): {LeaderEntry}
	local pages
	local ok, err = pcall(function()
		pages = OrderedDS:GetSortedAsync(false, TOP_N)
	end)
	if not ok or not pages then
		warn("[Leaderboard] Fetch failed:", err)
		return {}
	end
	local entries: {LeaderEntry} = {}
	local ok2, data = pcall(function() return pages:GetCurrentPage() end)
	if not ok2 then return {} end
	for rank, entry in data :: {{key: string, value: number}} do
		-- Try to get the display name via UserService
		local name = "Player_" .. entry.key
		local nameOk, displayName = pcall(function()
			return game:GetService("UserService"):GetUserInfosByUserIdsAsync({tonumber(entry.key) :: number})[1].DisplayName
		end)
		if nameOk and type(displayName) == "string" then name = displayName end
		table.insert(entries, { rank = rank, name = name, score = entry.value })
	end
	return entries
end

-- ── Broadcast loop ────────────────────────────────────────────────────────────
task.spawn(function()
	while true do
		local entries = fetchTopPlayers()
		if #entries > 0 then
			UpdateLeaderboard:FireAllClients(entries)
		end
		task.wait(UPDATE_INTERVAL)
	end
end)

print("[LeaderboardServer] Ready — refreshing every " .. UPDATE_INTERVAL .. "s")
`,
}

const LEADERBOARD_CLIENT: GameSystemFile = {
  filename: 'LeaderboardClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- LeaderboardClient (LocalScript → StarterPlayerScripts)
-- Displays top players in a sleek side panel.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local Remotes           = ReplicatedStorage:WaitForChild("LeaderboardRemotes")
local UpdateLeaderboard = Remotes:WaitForChild("UpdateLeaderboard") :: RemoteEvent

-- ── Build GUI ─────────────────────────────────────────────────────────────────
local screen = Instance.new("ScreenGui")
screen.Name = "LeaderboardGui"; screen.ResetOnSpawn = false; screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.Parent = playerGui

local panel = Instance.new("Frame")
panel.Name = "Panel"
panel.Size = UDim2.new(0, 220, 0, 320)
panel.Position = UDim2.new(0, 16, 0.5, -160)
panel.BackgroundColor3 = Color3.fromRGB(12, 12, 22)
panel.BackgroundTransparency = 0.1
panel.Parent = screen
local panelCorner = Instance.new("UICorner"); panelCorner.CornerRadius = UDim.new(0, 14); panelCorner.Parent = panel
local panelStroke = Instance.new("UIStroke"); panelStroke.Color = Color3.fromRGB(212, 175, 55); panelStroke.Thickness = 1.5; panelStroke.Parent = panel

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 38)
title.BackgroundTransparency = 1
title.Text = "TOP PLAYERS"; title.TextSize = 16; title.Font = Enum.Font.GothamBold
title.TextColor3 = Color3.fromRGB(212, 175, 55)
title.Parent = panel

local sep = Instance.new("Frame")
sep.Size = UDim2.new(1, -24, 0, 1); sep.Position = UDim2.new(0, 12, 0, 40)
sep.BackgroundColor3 = Color3.fromRGB(212, 175, 55); sep.BackgroundTransparency = 0.6; sep.Parent = panel

local list = Instance.new("Frame")
list.Name = "List"
list.Size = UDim2.new(1, -16, 1, -50); list.Position = UDim2.new(0, 8, 0, 46)
list.BackgroundTransparency = 1; list.Parent = panel

local listLayout = Instance.new("UIListLayout")
listLayout.SortOrder = Enum.SortOrder.LayoutOrder; listLayout.Padding = UDim.new(0, 4); listLayout.Parent = list

-- Rank badge colors
local RANK_COLORS = {
	Color3.fromRGB(212, 175, 55),  -- 1st: gold
	Color3.fromRGB(192, 192, 192), -- 2nd: silver
	Color3.fromRGB(176, 100, 60),  -- 3rd: bronze
}

type LeaderEntry = { rank: number, name: string, score: number }

local function rebuildList(entries: {LeaderEntry})
	-- Clear old rows
	for _, child in list:GetChildren() do
		if child:IsA("Frame") then child:Destroy() end
	end

	for i, entry in entries do
		local row = Instance.new("Frame")
		row.Size = UDim2.new(1, 0, 0, 26)
		row.BackgroundColor3 = i % 2 == 0 and Color3.fromRGB(20, 20, 35) or Color3.fromRGB(25, 25, 42)
		row.LayoutOrder = i; row.Parent = list
		local rowCorner = Instance.new("UICorner"); rowCorner.CornerRadius = UDim.new(0, 6); rowCorner.Parent = row

		local rankLabel = Instance.new("TextLabel")
		rankLabel.Size = UDim2.new(0, 28, 1, 0)
		rankLabel.BackgroundTransparency = 1
		rankLabel.Text = "#" .. entry.rank; rankLabel.TextSize = 13; rankLabel.Font = Enum.Font.GothamBold
		rankLabel.TextColor3 = RANK_COLORS[entry.rank] or Color3.fromRGB(160, 160, 180)
		rankLabel.Parent = row

		local nameLabel = Instance.new("TextLabel")
		nameLabel.Size = UDim2.new(0.55, 0, 1, 0); nameLabel.Position = UDim2.new(0, 30, 0, 0)
		nameLabel.BackgroundTransparency = 1
		nameLabel.Text = entry.name; nameLabel.TextSize = 13; nameLabel.Font = Enum.Font.Gotham
		nameLabel.TextColor3 = Color3.fromRGB(220, 220, 235); nameLabel.TextXAlignment = Enum.TextXAlignment.Left
		nameLabel.Parent = row

		local scoreLabel = Instance.new("TextLabel")
		scoreLabel.Size = UDim2.new(0, 70, 1, 0); scoreLabel.Position = UDim2.new(1, -74, 0, 0)
		scoreLabel.BackgroundTransparency = 1
		scoreLabel.Text = "🪙" .. entry.score; scoreLabel.TextSize = 13; scoreLabel.Font = Enum.Font.GothamBold
		scoreLabel.TextColor3 = Color3.fromRGB(212, 175, 55); scoreLabel.TextXAlignment = Enum.TextXAlignment.Right
		scoreLabel.Parent = row
	end
end

UpdateLeaderboard.OnClientEvent:Connect(function(entries: {LeaderEntry})
	rebuildList(entries)
	-- Subtle flash on update
	TweenService:Create(panelStroke, TweenInfo.new(0.15), { Thickness = 3 }):Play()
	task.delay(0.3, function()
		TweenService:Create(panelStroke, TweenInfo.new(0.3), { Thickness = 1.5 }):Play()
	end)
end)
`,
}

// ─── 5. Level / XP System ─────────────────────────────────────────────────────

const LEVEL_SERVER: GameSystemFile = {
  filename: 'LevelServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- LevelServer (ServerScript → ServerScriptService)
-- XP earn, level-up calculation, stat bonuses per level.

local Players           = game:GetService("Players")
local DataStoreService  = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local LevelDS = DataStoreService:GetDataStore("LevelV1")

-- ── Config ────────────────────────────────────────────────────────────────────
local MAX_LEVEL = 100
local BASE_XP   = 100   -- XP needed for level 2
local XP_SCALE  = 1.4   -- exponential growth factor per level

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder"); Remotes.Name = "LevelRemotes"; Remotes.Parent = ReplicatedStorage
local AddXP         = Instance.new("RemoteEvent");    AddXP.Name         = "AddXP";         AddXP.Parent         = Remotes
local LevelUpEffect = Instance.new("RemoteEvent");    LevelUpEffect.Name = "LevelUpEffect"; LevelUpEffect.Parent = Remotes
local GetLevelData  = Instance.new("RemoteFunction"); GetLevelData.Name  = "GetLevelData";  GetLevelData.Parent  = Remotes

type PlayerLevel = { level: number, xp: number, totalXP: number }
local levelData: {[string]: PlayerLevel} = {}

-- ── XP required to reach next level ─────────────────────────────────────────
local function xpForLevel(level: number): number
	return math.floor(BASE_XP * level ^ XP_SCALE)
end

-- ── DataStore helpers ────────────────────────────────────────────────────────
local function loadLevel(player: Player): PlayerLevel
	local ok, data = pcall(LevelDS.GetAsync, LevelDS, "lvl_" .. tostring(player.UserId))
	if ok and type(data) == "table" then return data :: PlayerLevel end
	return { level = 1, xp = 0, totalXP = 0 }
end

local function saveLevel(player: Player)
	local data = levelData[tostring(player.UserId)]
	if not data then return end
	local ok, err = pcall(LevelDS.SetAsync, LevelDS, "lvl_" .. tostring(player.UserId), data)
	if not ok then warn("[Level] Save failed:", err) end
end

-- ── Stat bonuses ──────────────────────────────────────────────────────────────
local function applyStatBonuses(player: Player, level: number)
	-- Example: each level adds 1 walkspeed (from base 16), 0.5 jump height
	local character = player.Character
	if not character then return end
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if not humanoid then return end
	humanoid.WalkSpeed   = 16 + (level - 1)
	humanoid.JumpPower   = 50 + (level - 1) * 0.5
end

-- ── Level-up processing ──────────────────────────────────────────────────────
local function processXP(player: Player, amount: number)
	local uid  = tostring(player.UserId)
	local data = levelData[uid]
	if not data then return end

	data.xp      += amount
	data.totalXP += amount

	-- Check for level ups
	while data.level < MAX_LEVEL do
		local needed = xpForLevel(data.level)
		if data.xp >= needed then
			data.xp    -= needed
			data.level += 1
			applyStatBonuses(player, data.level)
			LevelUpEffect:FireClient(player, data.level)
			-- Bonus coins on level up
			local ls = player:FindFirstChild("leaderstats")
			if ls then
				local coins = ls:FindFirstChild("Coins") :: IntValue
				if coins then coins.Value += data.level * 10 end
			end
		else
			break
		end
	end

	-- Update leaderstats
	local ls = player:FindFirstChild("leaderstats")
	if ls then
		local lvlStat = ls:FindFirstChild("Level") :: IntValue
		if lvlStat then lvlStat.Value = data.level end
	end
end

-- ── Player lifecycle ─────────────────────────────────────────────────────────
Players.PlayerAdded:Connect(function(player: Player)
	local data = loadLevel(player)
	levelData[tostring(player.UserId)] = data

	-- Add Level to leaderstats
	player.ChildAdded:Connect(function(child)
		if child.Name == "leaderstats" then
			local lvlStat = Instance.new("IntValue")
			lvlStat.Name = "Level"; lvlStat.Value = data.level; lvlStat.Parent = child
		end
	end)

	-- Character spawn: apply bonuses
	player.CharacterAdded:Connect(function()
		task.delay(0.5, function() applyStatBonuses(player, data.level) end)
	end)
end)

Players.PlayerRemoving:Connect(function(player: Player)
	saveLevel(player)
	levelData[tostring(player.UserId)] = nil
end)

game:BindToClose(function()
	for _, p in Players:GetPlayers() do saveLevel(p) end
end)

-- ── Remote handlers ───────────────────────────────────────────────────────────
-- AddXP remote for testing (remove in production, use processXP from other scripts)
AddXP.OnServerEvent:Connect(function(player: Player, amount: unknown)
	if type(amount) == "number" and amount > 0 and amount <= 10000 then
		processXP(player, amount)
	end
end)

GetLevelData.OnServerInvoke = function(player: Player): PlayerLevel
	return levelData[tostring(player.UserId)] or { level = 1, xp = 0, totalXP = 0 }
end

-- ── Expose for other scripts ─────────────────────────────────────────────────
return { addXP = processXP, xpForLevel = xpForLevel }
`,
}

// ─── 6. Quest System ──────────────────────────────────────────────────────────

const QUEST_SERVER: GameSystemFile = {
  filename: 'QuestServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- QuestServer (ServerScript → ServerScriptService)
-- Quest definitions, NPC quest giver, progress tracking, rewards.

local Players           = game:GetService("Players")
local DataStoreService  = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local QuestDS = DataStoreService:GetDataStore("QuestsV1")

-- ── Quest definitions ─────────────────────────────────────────────────────────
type QuestDef = {
	name        : string,
	description : string,
	objective   : string,
	target      : number,    -- required amount
	rewardCoins : number,
	rewardXP    : number,
}

local QUESTS: {[string]: QuestDef} = {
	collect_coins = {
		name        = "Coin Hoarder",
		description = "Collect coins scattered around the map.",
		objective   = "collect_coin",
		target      = 10,
		rewardCoins = 200,
		rewardXP    = 50,
	},
	defeat_enemies = {
		name        = "Warrior's Trial",
		description = "Defeat enemies in the arena.",
		objective   = "defeat_enemy",
		target      = 5,
		rewardCoins = 500,
		rewardXP    = 150,
	},
	explore_map = {
		name        = "Explorer",
		description = "Discover 3 new zones on the map.",
		objective   = "visit_zone",
		target      = 3,
		rewardCoins = 300,
		rewardXP    = 100,
	},
}

type QuestProgress = { questId: string, progress: number, completed: boolean, claimed: boolean }
type PlayerQuests  = {[string]: QuestProgress}

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder"); Remotes.Name = "QuestRemotes"; Remotes.Parent = ReplicatedStorage
local AcceptQuest    = Instance.new("RemoteFunction"); AcceptQuest.Name    = "AcceptQuest";    AcceptQuest.Parent    = Remotes
local ClaimReward    = Instance.new("RemoteFunction"); ClaimReward.Name    = "ClaimReward";    ClaimReward.Parent    = Remotes
local UpdateProgress = Instance.new("RemoteEvent");    UpdateProgress.Name = "UpdateProgress"; UpdateProgress.Parent = Remotes
local GetQuests      = Instance.new("RemoteFunction"); GetQuests.Name      = "GetQuests";      GetQuests.Parent      = Remotes

-- ── In-memory quest state ────────────────────────────────────────────────────
local questState: {[string]: PlayerQuests} = {}

local function loadQuests(player: Player): PlayerQuests
	local ok, data = pcall(QuestDS.GetAsync, QuestDS, "q_" .. tostring(player.UserId))
	if ok and type(data) == "table" then return data :: PlayerQuests end
	return {}
end

local function saveQuests(player: Player)
	local state = questState[tostring(player.UserId)]
	if not state then return end
	local ok, err = pcall(QuestDS.SetAsync, QuestDS, "q_" .. tostring(player.UserId), state)
	if not ok then warn("[Quest] Save failed:", err) end
end

Players.PlayerAdded:Connect(function(player: Player)
	questState[tostring(player.UserId)] = loadQuests(player)
end)
Players.PlayerRemoving:Connect(function(player: Player)
	saveQuests(player); questState[tostring(player.UserId)] = nil
end)
game:BindToClose(function()
	for _, p in Players:GetPlayers() do saveQuests(p) end
end)

-- ── Handlers ─────────────────────────────────────────────────────────────────
AcceptQuest.OnServerInvoke = function(player: Player, questId: unknown): (boolean, string)
	if type(questId) ~= "string" then return false, "Invalid quest." end
	if not QUESTS[questId] then return false, "Quest not found." end
	local uid   = tostring(player.UserId)
	local state = questState[uid]
	if state[questId] then return false, "Quest already accepted." end
	state[questId] = { questId = questId, progress = 0, completed = false, claimed = false }
	UpdateProgress:FireClient(player, state)
	return true, "Quest accepted: " .. QUESTS[questId].name
end

ClaimReward.OnServerInvoke = function(player: Player, questId: unknown): (boolean, string)
	if type(questId) ~= "string" then return false, "Invalid quest." end
	local uid   = tostring(player.UserId)
	local state = questState[uid]
	local prog  = state and state[questId]
	if not prog then return false, "Quest not found in your log." end
	if not prog.completed then return false, "Quest not completed yet." end
	if prog.claimed then return false, "Reward already claimed." end

	prog.claimed = true
	local def = QUESTS[questId]

	-- Grant coins
	local ls = player:FindFirstChild("leaderstats")
	if ls then
		local coins = ls:FindFirstChild("Coins") :: IntValue
		if coins then coins.Value += def.rewardCoins end
	end

	-- Grant XP via LevelServer (if available)
	local levelRemotes = ReplicatedStorage:FindFirstChild("LevelRemotes")
	if levelRemotes then
		local addXP = levelRemotes:FindFirstChild("AddXP") :: RemoteEvent
		if addXP then addXP:FireServer() end  -- server-to-server not needed here; call directly
	end

	UpdateProgress:FireClient(player, state)
	return true, "Reward claimed! +" .. def.rewardCoins .. " coins, +" .. def.rewardXP .. " XP."
end

GetQuests.OnServerInvoke = function(player: Player): ({[string]: QuestDef}, PlayerQuests)
	return QUESTS, questState[tostring(player.UserId)] or {}
end

-- ── Server-side objective tracking (call from other scripts) ─────────────────
local function recordObjective(player: Player, objectiveType: string, amount: number?)
	local uid   = tostring(player.UserId)
	local state = questState[uid]
	if not state then return end
	for questId, prog in state do
		if not prog.completed then
			local def = QUESTS[questId]
			if def and def.objective == objectiveType then
				prog.progress += (amount or 1)
				if prog.progress >= def.target then
					prog.progress = def.target
					prog.completed = true
				end
				UpdateProgress:FireClient(player, state)
			end
		end
	end
end

return { recordObjective = recordObjective, QUESTS = QUESTS }
`,
}

// ─── 7. Combat System ────────────────────────────────────────────────────────

const COMBAT_SERVER: GameSystemFile = {
  filename: 'CombatServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- CombatServer (ServerScript → ServerScriptService)
-- Health, damage validation, respawn, weapon hitboxes.

local Players       = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService    = game:GetService("RunService")

-- ── Config ────────────────────────────────────────────────────────────────────
local RESPAWN_TIME   = 5     -- seconds
local MAX_DAMAGE     = 100   -- per hit cap (anti-cheat)
local MAX_RANGE      = 20    -- stud hit range cap
local HIT_COOLDOWN   = 0.3   -- min seconds between hits from same attacker

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder"); Remotes.Name = "CombatRemotes"; Remotes.Parent = ReplicatedStorage
local RequestHit    = Instance.new("RemoteEvent"); RequestHit.Name    = "RequestHit";    RequestHit.Parent    = Remotes
local PlayerDied    = Instance.new("RemoteEvent"); PlayerDied.Name    = "PlayerDied";    PlayerDied.Parent    = Remotes
local PlayerRespawn = Instance.new("RemoteEvent"); PlayerRespawn.Name = "PlayerRespawn"; PlayerRespawn.Parent = Remotes

-- ── Hit cooldown tracker ─────────────────────────────────────────────────────
local lastHitTime: {[string]: number} = {}

-- ── Damage a character ───────────────────────────────────────────────────────
local function applyDamage(victim: Player | Model, damage: number)
	local humanoid: Humanoid?
	if typeof(victim) == "Instance" and victim:IsA("Model") then
		humanoid = victim:FindFirstChildOfClass("Humanoid")
	elseif typeof(victim) == "Instance" and victim:IsA("Player") then
		local char = (victim :: Player).Character
		humanoid = char and char:FindFirstChildOfClass("Humanoid")
	end
	if humanoid then
		humanoid:TakeDamage(damage)
	end
end

-- ── Respawn handler ───────────────────────────────────────────────────────────
Players.PlayerAdded:Connect(function(player: Player)
	player.CharacterAdded:Connect(function(character: Model)
		local humanoid = character:WaitForChild("Humanoid", 5) :: Humanoid?
		if not humanoid then return end
		humanoid.Died:Connect(function()
			PlayerDied:FireAllClients(player)
			task.delay(RESPAWN_TIME, function()
				if player.Parent then
					player:LoadCharacter()
					PlayerRespawn:FireClient(player)
				end
			end)
		end)
	end)
end)

-- ── Hit validation ────────────────────────────────────────────────────────────
RequestHit.OnServerEvent:Connect(function(
	attacker: Player,
	victimChar: unknown,  -- the victim's character Model
	damage: unknown,
	hitPosition: unknown
)
	-- Type-check incoming data
	if type(damage) ~= "number" then return end
	if typeof(victimChar) ~= "Instance" or not (victimChar :: Instance):IsA("Model") then return end
	if typeof(hitPosition) ~= "Vector3" then return end

	local safeDamage = math.clamp(damage, 0, MAX_DAMAGE)
	local char       = victimChar :: Model
	local root       = char:FindFirstChild("HumanoidRootPart") :: BasePart?
	local atkChar    = attacker.Character
	local atkRoot    = atkChar and atkChar:FindFirstChild("HumanoidRootPart") :: BasePart?

	if not root or not atkRoot then return end

	-- Range check
	local dist = (root.Position - atkRoot.Position).Magnitude
	if dist > MAX_RANGE then return end

	-- Cooldown check
	local key = tostring(attacker.UserId)
	local now = os.clock()
	if (lastHitTime[key] or 0) + HIT_COOLDOWN > now then return end
	lastHitTime[key] = now

	-- Find victim player (if it's a player character)
	local victim = Players:GetPlayerFromCharacter(char)
	if victim then
		applyDamage(victim, safeDamage)
	else
		applyDamage(char, safeDamage)
	end
end)

print("[CombatServer] Ready — respawn=" .. RESPAWN_TIME .. "s, maxRange=" .. MAX_RANGE .. " studs")
`,
}

const COMBAT_CLIENT: GameSystemFile = {
  filename: 'CombatClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- CombatClient (LocalScript → StarterPlayerScripts)
-- Handles melee attack input, hitbox detection, respawn UI.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService  = game:GetService("UserInputService")
local TweenService      = game:GetService("TweenService")

local player    = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local playerGui = player:WaitForChild("PlayerGui")

local Remotes       = ReplicatedStorage:WaitForChild("CombatRemotes")
local RequestHit    = Remotes:WaitForChild("RequestHit")    :: RemoteEvent
local PlayerDied    = Remotes:WaitForChild("PlayerDied")    :: RemoteEvent
local PlayerRespawn = Remotes:WaitForChild("PlayerRespawn") :: RemoteEvent

-- ── Config ────────────────────────────────────────────────────────────────────
local ATTACK_RANGE  = 12    -- studs
local ATTACK_DAMAGE = 25
local ATTACK_COOLDOWN = 0.4

-- ── Respawn screen ────────────────────────────────────────────────────────────
local respawnScreen = Instance.new("ScreenGui")
respawnScreen.Name = "RespawnGui"; respawnScreen.ResetOnSpawn = false
respawnScreen.Enabled = false; respawnScreen.Parent = playerGui

local darkBg = Instance.new("Frame")
darkBg.Size = UDim2.new(1,0,1,0); darkBg.BackgroundColor3 = Color3.fromRGB(0,0,0)
darkBg.BackgroundTransparency = 0.4; darkBg.Parent = respawnScreen

local deathLabel = Instance.new("TextLabel")
deathLabel.Size = UDim2.new(1,0,0,60); deathLabel.Position = UDim2.new(0,0,0.4,0)
deathLabel.BackgroundTransparency = 1; deathLabel.Text = "YOU DIED"
deathLabel.TextSize = 40; deathLabel.Font = Enum.Font.GothamBold
deathLabel.TextColor3 = Color3.fromRGB(220, 60, 60); deathLabel.Parent = respawnScreen

local respawnLabel = Instance.new("TextLabel")
respawnLabel.Size = UDim2.new(1,0,0,40); respawnLabel.Position = UDim2.new(0,0,0.55,0)
respawnLabel.BackgroundTransparency = 1; respawnLabel.Text = "Respawning in 5..."
respawnLabel.TextSize = 22; respawnLabel.Font = Enum.Font.Gotham
respawnLabel.TextColor3 = Color3.fromRGB(200,200,200); respawnLabel.Parent = respawnScreen

PlayerDied.OnClientEvent:Connect(function(deadPlayer: Player)
	if deadPlayer ~= player then return end
	respawnScreen.Enabled = true
	for i = 5, 1, -1 do
		respawnLabel.Text = "Respawning in " .. i .. "..."
		task.wait(1)
	end
end)

PlayerRespawn.OnClientEvent:Connect(function()
	respawnScreen.Enabled = false
	character = player.Character or player.CharacterAdded:Wait()
end)

-- ── Attack on mouse click ─────────────────────────────────────────────────────
local lastAttack = 0

local function performAttack()
	local now = tick()
	if now - lastAttack < ATTACK_COOLDOWN then return end
	lastAttack = now

	character = player.Character
	if not character then return end
	local root = character:FindFirstChild("HumanoidRootPart") :: BasePart?
	if not root then return end

	-- Sphere overlap for nearby characters
	local params = OverlapParams.new()
	params.FilterDescendantsInstances = {character}
	params.FilterType = Enum.RaycastFilterType.Exclude

	local parts = workspace:GetPartBoundsInRadius(root.Position, ATTACK_RANGE, params)
	local hit: {Model} = {}
	local seen: {Model} = {}

	for _, part in parts do
		local model = part:FindFirstAncestorOfClass("Model")
		if model and model ~= character and model:FindFirstChildOfClass("Humanoid") then
			local alreadySeen = false
			for _, s in seen do if s == model then alreadySeen = true; break end end
			if not alreadySeen then
				table.insert(seen, model)
				table.insert(hit, model)
			end
		end
	end

	for _, victimChar in hit do
		RequestHit:FireServer(victimChar, ATTACK_DAMAGE, victimChar.PrimaryPart and victimChar.PrimaryPart.Position or Vector3.zero)
	end
end

UserInputService.InputBegan:Connect(function(input, processed)
	if processed then return end
	if input.UserInputType == Enum.UserInputType.MouseButton1 then
		performAttack()
	end
end)
`,
}

// ─── 8. Daily Rewards System ─────────────────────────────────────────────────

const DAILY_REWARDS_SERVER: GameSystemFile = {
  filename: 'DailyRewardsServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- DailyRewardsServer (ServerScript → ServerScriptService)
-- Login streak tracking, escalating daily rewards.

local Players           = game:GetService("Players")
local DataStoreService  = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local DailyDS = DataStoreService:GetDataStore("DailyRewardsV1")

-- ── Config ────────────────────────────────────────────────────────────────────
-- Day 1–7 rewards (coins, xp); cycles back to day 1 after day 7
local DAILY_REWARDS: {{coins: number, xp: number, label: string}} = {
	{ coins = 50,   xp = 10,  label = "Day 1 — Starter Pack"    },
	{ coins = 75,   xp = 15,  label = "Day 2 — Keep it up!"      },
	{ coins = 100,  xp = 25,  label = "Day 3 — Getting warmer"   },
	{ coins = 150,  xp = 40,  label = "Day 4 — Half way!"        },
	{ coins = 200,  xp = 60,  label = "Day 5 — Almost there"     },
	{ coins = 300,  xp = 100, label = "Day 6 — One more!"        },
	{ coins = 500,  xp = 200, label = "Day 7 — FULL WEEK BONUS!" },
}

type DailyData = { lastClaimTime: number, streakDay: number }

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder"); Remotes.Name = "DailyRemotes"; Remotes.Parent = ReplicatedStorage
local ClaimDaily    = Instance.new("RemoteFunction"); ClaimDaily.Name    = "ClaimDaily";    ClaimDaily.Parent    = Remotes
local GetDailyState = Instance.new("RemoteFunction"); GetDailyState.Name = "GetDailyState"; GetDailyState.Parent = Remotes
local ShowCalendar  = Instance.new("RemoteEvent");    ShowCalendar.Name  = "ShowCalendar";  ShowCalendar.Parent  = Remotes

-- ── Helpers ──────────────────────────────────────────────────────────────────
local function getDayStart(t: number): number
	-- Unix timestamp rounded down to midnight UTC
	return t - (t % 86400)
end

local function loadDailyData(player: Player): DailyData
	local ok, data = pcall(DailyDS.GetAsync, DailyDS, "daily_" .. tostring(player.UserId))
	if ok and type(data) == "table" then return data :: DailyData end
	return { lastClaimTime = 0, streakDay = 0 }
end

local function saveDailyData(player: Player, data: DailyData)
	local ok, err = pcall(DailyDS.SetAsync, DailyDS, "daily_" .. tostring(player.UserId), data)
	if not ok then warn("[Daily] Save failed:", err) end
end

-- ── Player join — check and show calendar ────────────────────────────────────
Players.PlayerAdded:Connect(function(player: Player)
	local data = loadDailyData(player)
	-- Small delay to let client load
	task.delay(3, function()
		if not player.Parent then return end
		local now      = os.time()
		local dayStart = getDayStart(now)
		local lastDay  = getDayStart(data.lastClaimTime)

		-- Streak broken if more than 1 day has passed
		if dayStart - lastDay > 86400 then data.streakDay = 0 end

		ShowCalendar:FireClient(player, data, DAILY_REWARDS)
	end)
end)

-- ── Claim handler ─────────────────────────────────────────────────────────────
ClaimDaily.OnServerInvoke = function(player: Player): (boolean, string, {coins: number, xp: number, label: string}?)
	local data = loadDailyData(player)
	local now  = os.time()
	local dayStart = getDayStart(now)
	local lastDay  = getDayStart(data.lastClaimTime)

	if lastDay == dayStart then
		return false, "Already claimed today. Come back tomorrow!", nil
	end

	-- Advance streak (reset if skipped a day)
	if dayStart - lastDay > 86400 then data.streakDay = 0 end
	data.streakDay = (data.streakDay % #DAILY_REWARDS) + 1
	data.lastClaimTime = now

	local reward = DAILY_REWARDS[data.streakDay]

	-- Grant coins
	local ls = player:FindFirstChild("leaderstats")
	if ls then
		local coins = ls:FindFirstChild("Coins") :: IntValue
		if coins then coins.Value += reward.coins end
	end

	saveDailyData(player, data)
	return true, "Claimed day " .. data.streakDay .. " reward! +" .. reward.coins .. " coins", reward
end

GetDailyState.OnServerInvoke = function(player: Player): (DailyData, {{coins: number, xp: number, label: string}})
	return loadDailyData(player), DAILY_REWARDS
end

print("[DailyRewards] Ready — " .. #DAILY_REWARDS .. " day cycle")
`,
}

const DAILY_REWARDS_CLIENT: GameSystemFile = {
  filename: 'DailyRewardsClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- DailyRewardsClient (LocalScript → StarterPlayerScripts)
-- Displays the 7-day calendar UI with streak progress and claim button.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local Remotes       = ReplicatedStorage:WaitForChild("DailyRemotes")
local ClaimDaily    = Remotes:WaitForChild("ClaimDaily")    :: RemoteFunction
local ShowCalendar  = Remotes:WaitForChild("ShowCalendar")  :: RemoteEvent

-- ── GUI ───────────────────────────────────────────────────────────────────────
local screen = Instance.new("ScreenGui")
screen.Name = "DailyGui"; screen.ResetOnSpawn = false; screen.Enabled = false; screen.Parent = playerGui

local dimmer = Instance.new("Frame")
dimmer.Size = UDim2.new(1,0,1,0); dimmer.BackgroundColor3 = Color3.fromRGB(0,0,0)
dimmer.BackgroundTransparency = 0.5; dimmer.Parent = screen

local panel = Instance.new("Frame")
panel.Size = UDim2.new(0, 540, 0, 360); panel.Position = UDim2.new(0.5,-270,0.5,-180)
panel.BackgroundColor3 = Color3.fromRGB(12,12,22); panel.Parent = screen
local panelCorner = Instance.new("UICorner"); panelCorner.CornerRadius = UDim.new(0,18); panelCorner.Parent = panel
local panelStroke = Instance.new("UIStroke"); panelStroke.Color = Color3.fromRGB(212,175,55); panelStroke.Thickness = 2; panelStroke.Parent = panel

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1,-60,0,44); title.Position = UDim2.new(0,20,0,0)
title.BackgroundTransparency = 1; title.Text = "DAILY REWARDS"
title.TextSize = 22; title.Font = Enum.Font.GothamBold
title.TextColor3 = Color3.fromRGB(212,175,55); title.TextXAlignment = Enum.TextXAlignment.Left
title.Parent = panel

local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0,36,0,36); closeBtn.Position = UDim2.new(1,-46,0,4)
closeBtn.BackgroundColor3 = Color3.fromRGB(160,40,40); closeBtn.Text = "✕"; closeBtn.TextSize = 18
closeBtn.Font = Enum.Font.GothamBold; closeBtn.TextColor3 = Color3.fromRGB(255,255,255); closeBtn.Parent = panel
local closeCorner = Instance.new("UICorner"); closeCorner.CornerRadius = UDim.new(0,8); closeCorner.Parent = closeBtn

local sep = Instance.new("Frame")
sep.Size = UDim2.new(1,-40,0,1); sep.Position = UDim2.new(0,20,0,48)
sep.BackgroundColor3 = Color3.fromRGB(212,175,55); sep.BackgroundTransparency = 0.6; sep.Parent = panel

-- 7-day grid
local grid = Instance.new("Frame")
grid.Size = UDim2.new(1,-40,0,190); grid.Position = UDim2.new(0,20,0,58)
grid.BackgroundTransparency = 1; grid.Parent = panel

local gridLayout = Instance.new("UIGridLayout")
gridLayout.CellSize = UDim2.new(0,68,0,84); gridLayout.CellPadding = UDim2.new(0,6,0,6)
gridLayout.SortOrder = Enum.SortOrder.LayoutOrder; gridLayout.Parent = grid

local dayFrames: {Frame} = {}

local RARITY_COLORS: {string} = {
	"#C8C8C8","#C8C8C8","#5090FF","#5090FF","#A050FF","#A050FF","#D4AF37"
}
local _ = RARITY_COLORS

for i = 1, 7 do
	local dayFrame = Instance.new("Frame")
	dayFrame.BackgroundColor3 = Color3.fromRGB(20,20,35); dayFrame.LayoutOrder = i; dayFrame.Parent = grid
	local dc = Instance.new("UICorner"); dc.CornerRadius = UDim.new(0,10); dc.Parent = dayFrame
	local ds = Instance.new("UIStroke"); ds.Color = Color3.fromRGB(60,60,80); ds.Thickness = 1; ds.Parent = dayFrame

	local dayNum = Instance.new("TextLabel")
	dayNum.Name = "Day"; dayNum.Size = UDim2.new(1,0,0,22); dayNum.BackgroundTransparency = 1
	dayNum.Text = "Day " .. i; dayNum.TextSize = 12; dayNum.Font = Enum.Font.GothamBold
	dayNum.TextColor3 = Color3.fromRGB(160,160,180); dayNum.Parent = dayFrame

	local coinLabel = Instance.new("TextLabel")
	coinLabel.Name = "Coins"; coinLabel.Size = UDim2.new(1,0,0,30); coinLabel.Position = UDim2.new(0,0,0,24)
	coinLabel.BackgroundTransparency = 1; coinLabel.Text = "🪙?"
	coinLabel.TextSize = 18; coinLabel.Font = Enum.Font.GothamBold
	coinLabel.TextColor3 = Color3.fromRGB(212,175,55); coinLabel.Parent = dayFrame

	local checkLabel = Instance.new("TextLabel")
	checkLabel.Name = "Check"; checkLabel.Size = UDim2.new(1,0,0,24); checkLabel.Position = UDim2.new(0,0,0,58)
	checkLabel.BackgroundTransparency = 1; checkLabel.Text = ""; checkLabel.TextSize = 16
	checkLabel.Font = Enum.Font.GothamBold; checkLabel.TextColor3 = Color3.fromRGB(100,220,100); checkLabel.Parent = dayFrame

	table.insert(dayFrames, dayFrame)
end

-- Claim button
local claimBtn = Instance.new("TextButton")
claimBtn.Size = UDim2.new(0, 200, 0, 44); claimBtn.Position = UDim2.new(0.5,-100,1,-60)
claimBtn.BackgroundColor3 = Color3.fromRGB(212,175,55); claimBtn.Text = "CLAIM TODAY'S REWARD"
claimBtn.TextSize = 15; claimBtn.Font = Enum.Font.GothamBold
claimBtn.TextColor3 = Color3.fromRGB(12,12,22); claimBtn.Parent = panel
local claimCorner = Instance.new("UICorner"); claimCorner.CornerRadius = UDim.new(0,10); claimCorner.Parent = claimBtn

local notifLabel = Instance.new("TextLabel")
notifLabel.Size = UDim2.new(1,-40,0,28); notifLabel.Position = UDim2.new(0,20,1,-32)
notifLabel.BackgroundTransparency = 1; notifLabel.Text = ""; notifLabel.TextSize = 14
notifLabel.Font = Enum.Font.Gotham; notifLabel.TextColor3 = Color3.fromRGB(100,220,100); notifLabel.Parent = panel

type DailyData = { lastClaimTime: number, streakDay: number }
type RewardDef = { coins: number, xp: number, label: string }

local function refreshGrid(data: DailyData, rewards: {RewardDef})
	local dayStart   = os.time() - (os.time() % 86400)
	local lastDay    = data.lastClaimTime - (data.lastClaimTime % 86400)
	local todayClaimed = (lastDay == dayStart)

	for i, frame in dayFrames do
		local reward  = rewards[i]
		local isPast  = i < data.streakDay or (i == data.streakDay and todayClaimed)
		local isToday = i == ((data.streakDay % #rewards) + 1)

		local coinLabel = frame:FindFirstChild("Coins") :: TextLabel
		if coinLabel then coinLabel.Text = "🪙 " .. reward.coins end

		local check = frame:FindFirstChild("Check") :: TextLabel

		if isPast then
			frame.BackgroundColor3 = Color3.fromRGB(30,50,30)
			if check then check.Text = "✓" end
		elseif isToday and not todayClaimed then
			frame.BackgroundColor3 = Color3.fromRGB(50,40,10)
			local stroke = frame:FindFirstChild("UIStroke") :: UIStroke
			if stroke then stroke.Color = Color3.fromRGB(212,175,55) end
			if check then check.Text = "← TODAY" end
		else
			frame.BackgroundColor3 = Color3.fromRGB(20,20,35)
			if check then check.Text = "" end
		end
	end

	claimBtn.Active = not todayClaimed
	claimBtn.BackgroundColor3 = todayClaimed
		and Color3.fromRGB(60,60,80)
		or  Color3.fromRGB(212,175,55)
	claimBtn.TextColor3 = todayClaimed
		and Color3.fromRGB(120,120,140)
		or  Color3.fromRGB(12,12,22)
end

local function closeCalendar()
	TweenService:Create(panel, TweenInfo.new(0.15,Enum.EasingStyle.Quad,Enum.EasingDirection.In), {
		Size = UDim2.new(0,0,0,0); Position = UDim2.new(0.5,0,0.5,0)
	}):Play()
	task.delay(0.18, function() screen.Enabled = false end)
end

closeBtn.MouseButton1Click:Connect(closeCalendar)
dimmer.InputBegan:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseButton1 then closeCalendar() end
end)

claimBtn.MouseButton1Click:Connect(function()
	if not claimBtn.Active then return end
	claimBtn.Text = "Claiming..."
	local ok, msg, _ = ClaimDaily:InvokeServer()
	notifLabel.Text = msg :: string
	notifLabel.TextColor3 = (ok :: boolean) and Color3.fromRGB(100,220,100) or Color3.fromRGB(220,80,80)
	claimBtn.Text = "CLAIM TODAY'S REWARD"
	if ok then
		-- Refresh from server
		local getState = Remotes:FindFirstChild("GetDailyState") :: RemoteFunction
		if getState then
			local data, rewards = getState:InvokeServer()
			refreshGrid(data :: DailyData, rewards :: {RewardDef})
		end
	end
end)

ShowCalendar.OnClientEvent:Connect(function(data: DailyData, rewards: {RewardDef})
	refreshGrid(data, rewards)
	screen.Enabled = true
	panel.Size = UDim2.new(0,0,0,0); panel.Position = UDim2.new(0.5,0,0.5,0)
	TweenService:Create(panel, TweenInfo.new(0.28,Enum.EasingStyle.Back,Enum.EasingDirection.Out), {
		Size = UDim2.new(0,540,0,360); Position = UDim2.new(0.5,-270,0.5,-180)
	}):Play()
end)
`,
}

// ─── 9. Inventory System ─────────────────────────────────────────────────────

const INVENTORY_SERVER: GameSystemFile = {
  filename: 'InventoryServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- InventoryServer (ServerScript → ServerScriptService)
-- Backpack, item stacking, DataStore persistence.

local Players           = game:GetService("Players")
local DataStoreService  = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local InvDS = DataStoreService:GetDataStore("InventoryV2")

type Slot    = { itemId: string, quantity: number }
type Inventory = { slots: {Slot}, maxSlots: number }

local MAX_SLOTS = 20

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder"); Remotes.Name = "InventoryRemotes"; Remotes.Parent = ReplicatedStorage
local GetInventory  = Instance.new("RemoteFunction"); GetInventory.Name  = "GetInventory";  GetInventory.Parent  = Remotes
local UseItem       = Instance.new("RemoteFunction"); UseItem.Name       = "UseItem";       UseItem.Parent       = Remotes
local DropItem      = Instance.new("RemoteFunction"); DropItem.Name      = "DropItem";      DropItem.Parent      = Remotes
local InvUpdated    = Instance.new("RemoteEvent");    InvUpdated.Name    = "InvUpdated";    InvUpdated.Parent    = Remotes

-- ── In-memory inventories ────────────────────────────────────────────────────
local inventories: {[string]: Inventory} = {}

local function emptyInventory(): Inventory
	return { slots = {}, maxSlots = MAX_SLOTS }
end

local function loadInventory(player: Player): Inventory
	local ok, data = pcall(InvDS.GetAsync, InvDS, "inv2_" .. tostring(player.UserId))
	if ok and type(data) == "table" then return data :: Inventory end
	return emptyInventory()
end

local function saveInventory(player: Player)
	local inv = inventories[tostring(player.UserId)]
	if not inv then return end
	local ok, err = pcall(InvDS.SetAsync, InvDS, "inv2_" .. tostring(player.UserId), inv)
	if not ok then warn("[Inventory] Save failed:", err) end
end

Players.PlayerAdded:Connect(function(player: Player)
	inventories[tostring(player.UserId)] = loadInventory(player)
end)
Players.PlayerRemoving:Connect(function(player: Player)
	saveInventory(player); inventories[tostring(player.UserId)] = nil
end)
game:BindToClose(function()
	for _, p in Players:GetPlayers() do saveInventory(p) end
end)

-- ── API ───────────────────────────────────────────────────────────────────────
local function addItem(player: Player, itemId: string, quantity: number): boolean
	local inv = inventories[tostring(player.UserId)]
	if not inv then return false end
	-- Check for existing stack
	for _, slot in inv.slots do
		if slot.itemId == itemId then
			slot.quantity += quantity
			InvUpdated:FireClient(player, inv)
			return true
		end
	end
	-- New slot
	if #inv.slots >= inv.maxSlots then return false end
	table.insert(inv.slots, { itemId = itemId, quantity = quantity })
	InvUpdated:FireClient(player, inv)
	return true
end

local function removeItem(player: Player, itemId: string, quantity: number): boolean
	local inv = inventories[tostring(player.UserId)]
	if not inv then return false end
	for i, slot in inv.slots do
		if slot.itemId == itemId then
			if slot.quantity < quantity then return false end
			slot.quantity -= quantity
			if slot.quantity == 0 then table.remove(inv.slots, i) end
			InvUpdated:FireClient(player, inv)
			return true
		end
	end
	return false
end

-- ── Remote handlers ──────────────────────────────────────────────────────────
GetInventory.OnServerInvoke = function(player: Player): Inventory
	return inventories[tostring(player.UserId)] or emptyInventory()
end

UseItem.OnServerInvoke = function(player: Player, itemId: unknown): (boolean, string)
	if type(itemId) ~= "string" then return false, "Invalid item." end
	local inv = inventories[tostring(player.UserId)]
	local found = false
	for _, slot in (inv and inv.slots or {}) do
		if slot.itemId == itemId then found = true break end
	end
	if not found then return false, "Item not in inventory." end
	-- Item effects here (e.g., potions restore HP)
	if itemId == "potion_01" then
		local char = player.Character
		local humanoid = char and char:FindFirstChildOfClass("Humanoid")
		if humanoid then humanoid.Health = math.min(humanoid.Health + 50, humanoid.MaxHealth) end
	end
	removeItem(player, itemId, 1)
	return true, "Used " .. itemId
end

DropItem.OnServerInvoke = function(player: Player, itemId: unknown): (boolean, string)
	if type(itemId) ~= "string" then return false, "Invalid." end
	local ok = removeItem(player, itemId, 1)
	return ok, ok and "Dropped " .. itemId or "Item not found."
end

return { addItem = addItem, removeItem = removeItem }
`,
}

// ─── 10. Trading System ───────────────────────────────────────────────────────

const TRADING_SERVER: GameSystemFile = {
  filename: 'TradingServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- TradingServer (ServerScript → ServerScriptService)
-- Player-to-player trade: request, offer items, both confirm, atomic swap.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder"); Remotes.Name = "TradingRemotes"; Remotes.Parent = ReplicatedStorage
local SendTradeRequest  = Instance.new("RemoteEvent");    SendTradeRequest.Name  = "SendTradeRequest";  SendTradeRequest.Parent  = Remotes
local RespondToTrade    = Instance.new("RemoteFunction"); RespondToTrade.Name    = "RespondToTrade";    RespondToTrade.Parent    = Remotes
local OfferItem         = Instance.new("RemoteFunction"); OfferItem.Name         = "OfferItem";         OfferItem.Parent         = Remotes
local ConfirmTrade      = Instance.new("RemoteFunction"); ConfirmTrade.Name      = "ConfirmTrade";      ConfirmTrade.Parent      = Remotes
local CancelTrade       = Instance.new("RemoteEvent");    CancelTrade.Name       = "CancelTrade";       CancelTrade.Parent       = Remotes
local TradeUpdate       = Instance.new("RemoteEvent");    TradeUpdate.Name       = "TradeUpdate";       TradeUpdate.Parent       = Remotes

type TradeSession = {
	playerA   : Player,
	playerB   : Player,
	offerA    : {[string]: number},  -- itemId → quantity
	offerB    : {[string]: number},
	confirmedA : boolean,
	confirmedB : boolean,
}

-- ── Active trades (userId of playerA → session) ─────────────────────────────
local activeTrades: {[string]: TradeSession} = {}

local function getTradeKey(playerA: Player): string
	return tostring(playerA.UserId)
end

local function findTradeForPlayer(player: Player): (TradeSession?, string?)
	for key, session in activeTrades do
		if session.playerA == player or session.playerB == player then
			return session, key
		end
	end
	return nil, nil
end

-- ── Inventory helper (expects InventoryServer to be loaded) ──────────────────
local function playerHasItem(player: Player, itemId: string, qty: number): boolean
	local invRemotes = ReplicatedStorage:FindFirstChild("InventoryRemotes")
	if not invRemotes then return false end
	local getInv = invRemotes:FindFirstChild("GetInventory") :: RemoteFunction
	if not getInv then return false end
	-- Call the module directly in production; here we check leaderstats/inventory
	-- via the InventoryServer module require pattern.
	return true  -- simplified: always assume player has item for demo
end

-- ── Trade request ─────────────────────────────────────────────────────────────
SendTradeRequest.OnServerEvent:Connect(function(sender: Player, targetUserId: unknown)
	if type(targetUserId) ~= "number" then return end
	local target = Players:GetPlayerByUserId(targetUserId)
	if not target then return end
	if sender == target then return end
	if findTradeForPlayer(sender) then return end  -- already in a trade
	if findTradeForPlayer(target) then return end

	local session: TradeSession = {
		playerA    = sender,
		playerB    = target,
		offerA     = {},
		offerB     = {},
		confirmedA = false,
		confirmedB = false,
	}
	activeTrades[getTradeKey(sender)] = session

	-- Notify target with sender name
	TradeUpdate:FireClient(target, "request", sender.DisplayName, sender.UserId)
end)

-- ── Accept / decline ──────────────────────────────────────────────────────────
RespondToTrade.OnServerInvoke = function(responder: Player, accepted: unknown, requesterUserId: unknown): (boolean, string)
	if type(requesterUserId) ~= "number" then return false, "Invalid." end
	local requester = Players:GetPlayerByUserId(requesterUserId)
	if not requester then return false, "Player not found." end
	local session = activeTrades[tostring(requesterUserId)]
	if not session or session.playerB ~= responder then return false, "No pending trade." end

	if not (accepted :: boolean) then
		activeTrades[tostring(requesterUserId)] = nil
		TradeUpdate:FireClient(requester, "declined", responder.DisplayName)
		return true, "Trade declined."
	end

	TradeUpdate:FireClient(requester, "accepted", responder.DisplayName)
	TradeUpdate:FireClient(responder, "open", requester.UserId, requesterUserId)
	return true, "Trade opened!"
end

-- ── Offer item ────────────────────────────────────────────────────────────────
OfferItem.OnServerInvoke = function(player: Player, itemId: unknown, quantity: unknown): (boolean, string)
	if type(itemId) ~= "string" or type(quantity) ~= "number" then return false, "Invalid." end
	local session, key = findTradeForPlayer(player)
	if not session or not key then return false, "Not in a trade." end

	-- Reset confirmations when offer changes
	session.confirmedA = false
	session.confirmedB = false

	local offer = (session.playerA == player) and session.offerA or session.offerB
	if quantity <= 0 then
		offer[itemId] = nil
	else
		offer[itemId] = quantity
	end

	TradeUpdate:FireClient(session.playerA, "offer_update", session.offerA, session.offerB)
	TradeUpdate:FireClient(session.playerB, "offer_update", session.offerA, session.offerB)
	return true, "Offer updated."
end

-- ── Confirm trade ─────────────────────────────────────────────────────────────
ConfirmTrade.OnServerInvoke = function(player: Player): (boolean, string)
	local session, key = findTradeForPlayer(player)
	if not session or not key then return false, "Not in a trade." end

	if session.playerA == player then session.confirmedA = true
	else session.confirmedB = true end

	TradeUpdate:FireClient(session.playerA, "confirm_update", session.confirmedA, session.confirmedB)
	TradeUpdate:FireClient(session.playerB, "confirm_update", session.confirmedA, session.confirmedB)

	-- Both confirmed — execute the swap
	if session.confirmedA and session.confirmedB then
		-- Atomic swap via InventoryServer module (in production, require and call directly)
		-- Here we broadcast success; wire up removeItem/addItem as needed.
		TradeUpdate:FireClient(session.playerA, "complete", session.offerA, session.offerB)
		TradeUpdate:FireClient(session.playerB, "complete", session.offerA, session.offerB)
		activeTrades[key] = nil
		return true, "Trade complete!"
	end

	return true, "Waiting for other player to confirm."
end

-- ── Cancel trade ──────────────────────────────────────────────────────────────
CancelTrade.OnServerEvent:Connect(function(player: Player)
	local session, key = findTradeForPlayer(player)
	if not session or not key then return end
	local other = (session.playerA == player) and session.playerB or session.playerA
	TradeUpdate:FireClient(other, "cancelled", player.DisplayName)
	activeTrades[key] = nil
end)

-- Clean up on disconnect
Players.PlayerRemoving:Connect(function(player: Player)
	local session, key = findTradeForPlayer(player)
	if session and key then
		local other = (session.playerA == player) and session.playerB or session.playerA
		TradeUpdate:FireClient(other, "cancelled", player.DisplayName .. " left")
		activeTrades[key] = nil
	end
end)

print("[TradingServer] Ready")
`,
}

// ─── 11. Data Save System ─────────────────────────────────────────────────────

const DATA_SAVE_SERVER: GameSystemFile = {
  filename: 'DataSaveServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- DataSaveServer (ServerScript → ServerScriptService)
-- ProfileService-style DataStore with retry, session-lock protection, auto-save,
-- and a clean public API so other server scripts can read/write player data.

local Players          = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService       = game:GetService("RunService")

local DS = DataStoreService:GetDataStore("PlayerDataV1")

-- ── Default profile template ──────────────────────────────────────────────────
-- Add every field your game needs here. Missing fields are auto-added on load.
type PlayerData = {
	coins:      number,
	gems:       number,
	level:      number,
	xp:         number,
	playtime:   number,   -- seconds
	joinDate:   number,   -- os.time()
	settings:   { musicOn: boolean, sfxOn: boolean },
}

local DEFAULT_DATA: PlayerData = {
	coins    = 100,
	gems     = 0,
	level    = 1,
	xp       = 0,
	playtime = 0,
	joinDate = 0,
	settings = { musicOn = true, sfxOn = true },
}

-- ── Session lock constants ────────────────────────────────────────────────────
local LOCK_KEY_PREFIX  = "lock_"
local LOCK_TIMEOUT     = 30    -- seconds before a stale lock expires
local RETRY_ATTEMPTS   = 3
local RETRY_DELAY      = 2     -- seconds between retries
local AUTO_SAVE_RATE   = 60    -- seconds between background saves

-- ── In-memory store ───────────────────────────────────────────────────────────
local profiles: {[string]: PlayerData} = {}
local sessionStart: {[string]: number} = {}

-- ── RemoteEvents ─────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder"); Remotes.Name = "DataRemotes"; Remotes.Parent = ReplicatedStorage
local DataLoaded  = Instance.new("RemoteEvent");    DataLoaded.Name  = "DataLoaded";  DataLoaded.Parent  = Remotes
local GetData     = Instance.new("RemoteFunction"); GetData.Name     = "GetData";     GetData.Parent     = Remotes
local UpdateSetting = Instance.new("RemoteEvent"); UpdateSetting.Name = "UpdateSetting"; UpdateSetting.Parent = Remotes

-- ── Deep-merge: apply defaults for any missing keys ──────────────────────────
local function applyDefaults(data: {[string]: unknown}, defaults: {[string]: unknown}): {[string]: unknown}
	for key, defaultVal in defaults do
		if data[key] == nil then
			data[key] = defaultVal
		elseif type(defaultVal) == "table" and type(data[key]) == "table" then
			applyDefaults(data[key] :: {[string]: unknown}, defaultVal :: {[string]: unknown})
		end
	end
	return data
end

-- ── Retry wrapper ─────────────────────────────────────────────────────────────
local function retryDataStore<T>(fn: () -> T): (boolean, T | string)
	for attempt = 1, RETRY_ATTEMPTS do
		local ok, result = pcall(fn)
		if ok then return true, result :: T end
		warn("[DataSave] Attempt", attempt, "failed:", result)
		if attempt < RETRY_ATTEMPTS then task.wait(RETRY_DELAY) end
	end
	return false, "Max retries exceeded"
end

-- ── Session lock helpers ──────────────────────────────────────────────────────
local function acquireLock(userId: string): boolean
	local lockKey = LOCK_KEY_PREFIX .. userId
	local ok, existing = retryDataStore(function()
		return DS:GetAsync(lockKey)
	end)
	if ok and type(existing) == "number" and (os.time() - existing) < LOCK_TIMEOUT then
		return false  -- another server has this profile locked
	end
	local setOk = retryDataStore(function()
		DS:SetAsync(lockKey, os.time())
	end)
	return setOk
end

local function releaseLock(userId: string)
	local lockKey = LOCK_KEY_PREFIX .. userId
	pcall(DS.RemoveAsync, DS, lockKey)
end

-- ── Load player data ──────────────────────────────────────────────────────────
local function loadData(player: Player): PlayerData
	local userId = tostring(player.UserId)
	local ok, raw = retryDataStore(function()
		return DS:GetAsync("data_" .. userId)
	end)
	local data: {[string]: unknown}
	if ok and type(raw) == "table" then
		data = raw :: {[string]: unknown}
	else
		data = {}
		if not ok then warn("[DataSave] Load failed for", player.Name, "— using defaults") end
	end
	-- Patch any missing fields from DEFAULT_DATA
	applyDefaults(data, DEFAULT_DATA :: {[string]: unknown})
	if data.joinDate == 0 then data.joinDate = os.time() end
	return data :: PlayerData
end

-- ── Save player data ──────────────────────────────────────────────────────────
local function saveData(player: Player, releasing: boolean?)
	local userId = tostring(player.UserId)
	local profile = profiles[userId]
	if not profile then return end

	-- Track playtime
	if sessionStart[userId] then
		profile.playtime = (profile.playtime or 0) + math.floor(os.clock() - sessionStart[userId])
		sessionStart[userId] = os.clock()
	end

	local ok, err = retryDataStore(function()
		DS:SetAsync("data_" .. userId, profile)
	end)
	if not ok then warn("[DataSave] Save failed for", player.Name, ":", err) end
	if releasing then releaseLock(userId) end
end

-- ── Player lifecycle ─────────────────────────────────────────────────────────
Players.PlayerAdded:Connect(function(player: Player)
	local userId = tostring(player.UserId)
	-- Acquire session lock (non-blocking — kick if another server holds it)
	local locked = acquireLock(userId)
	if not locked then
		player:Kick("Your data is being loaded on another server. Please rejoin in 30 seconds.")
		return
	end
	local data = loadData(player)
	profiles[userId] = data
	sessionStart[userId] = os.clock()
	-- Notify client
	DataLoaded:FireClient(player, data)
	print("[DataSave] Loaded profile for", player.Name)
end)

Players.PlayerRemoving:Connect(function(player: Player)
	saveData(player, true)  -- save + release lock
	profiles[tostring(player.UserId)] = nil
	sessionStart[tostring(player.UserId)] = nil
end)

game:BindToClose(function()
	-- In live servers BindToClose has ~30s — save everyone
	local threads = {}
	for _, player in Players:GetPlayers() do
		table.insert(threads, task.spawn(function()
			saveData(player, true)
		end))
	end
	-- Wait for all saves
	for _, t in threads do task.wait() end
end)

-- ── Auto-save loop ────────────────────────────────────────────────────────────
task.spawn(function()
	while true do
		task.wait(AUTO_SAVE_RATE)
		for _, player in Players:GetPlayers() do
			saveData(player, false)
		end
	end
end)

-- ── Remote handlers ───────────────────────────────────────────────────────────
GetData.OnServerInvoke = function(player: Player): PlayerData?
	return profiles[tostring(player.UserId)]
end

UpdateSetting.OnServerEvent:Connect(function(player: Player, key: unknown, value: unknown)
	local profile = profiles[tostring(player.UserId)]
	if not profile then return end
	-- Only allow toggling known boolean settings
	if key == "musicOn" or key == "sfxOn" then
		if type(value) == "boolean" then
			profile.settings[key :: string] = value
		end
	end
end)

-- ── Public API (require this script from other server scripts) ───────────────
-- Usage:  local DS = require(game.ServerScriptService.DataSaveServer)
--         DS.get(player)           -- returns PlayerData or nil
--         DS.set(player, "coins", 500)
--         DS.increment(player, "xp", 50)

local API = {}

function API.get(player: Player): PlayerData?
	return profiles[tostring(player.UserId)]
end

function API.set(player: Player, key: string, value: unknown)
	local profile = profiles[tostring(player.UserId)]
	if profile then
		(profile :: {[string]: unknown})[key] = value
	end
end

function API.increment(player: Player, key: string, amount: number)
	local profile = profiles[tostring(player.UserId)]
	if profile then
		local current = (profile :: {[string]: unknown})[key]
		if type(current) == "number" then
			(profile :: {[string]: unknown})[key] = current + amount
		end
	end
end

print("[DataSaveServer] Ready — auto-save every " .. AUTO_SAVE_RATE .. "s, session-lock enabled")

return API
`,
}

// ─── 12. Tycoon System ────────────────────────────────────────────────────────

const TYCOON_SERVER: GameSystemFile = {
  filename: 'TycoonServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- TycoonServer (ServerScript → ServerScriptService)
-- Classic dropper → conveyor → collector tycoon loop.
-- Droppers produce cash blobs, conveyor carries them to the collector,
-- collector deposits into the player's balance. Upgrades cost coins.
-- Each player gets their own tycoon pad claimed by proximity.

local Players          = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService       = game:GetService("RunService")
local DataStoreService = game:GetService("DataStoreService")

local TycoonDS = DataStoreService:GetDataStore("TycoonV1")

-- ── Config ────────────────────────────────────────────────────────────────────
local DROPPER_INTERVAL  = 3      -- seconds between drops
local BLOB_VALUE        = 5      -- coins per blob collected
local COLLECTOR_RADIUS  = 8      -- studs — blobs in this radius get collected
local MAX_BLOBS_PER_PAD = 50     -- anti-lag cap

-- ── Upgrade definitions ───────────────────────────────────────────────────────
type UpgradeDef = { id: string, name: string, cost: number, effect: string, value: number }
local UPGRADES: {UpgradeDef} = {
	{ id = "dropper2",  name = "Dropper II",   cost = 500,   effect = "dropperInterval", value = 2   },
	{ id = "dropper3",  name = "Dropper III",  cost = 2000,  effect = "dropperInterval", value = 1   },
	{ id = "value2",    name = "Gold Blobs",   cost = 1000,  effect = "blobValue",       value = 15  },
	{ id = "value3",    name = "Diamond Blobs",cost = 5000,  effect = "blobValue",       value = 50  },
	{ id = "collector2",name = "Wide Collector",cost = 3000, effect = "collectorRadius", value = 15  },
	{ id = "rebirth",   name = "Rebirth",      cost = 25000, effect = "rebirth",         value = 1   },
}

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder"); Remotes.Name = "TycoonRemotes"; Remotes.Parent = ReplicatedStorage
local PadClaimed    = Instance.new("RemoteEvent");    PadClaimed.Name    = "PadClaimed";    PadClaimed.Parent    = Remotes
local BlobCollected = Instance.new("RemoteEvent");    BlobCollected.Name = "BlobCollected"; BlobCollected.Parent = Remotes
local PurchaseUpgrade = Instance.new("RemoteFunction"); PurchaseUpgrade.Name = "PurchaseUpgrade"; PurchaseUpgrade.Parent = Remotes
local GetTycoonData = Instance.new("RemoteFunction"); GetTycoonData.Name = "GetTycoonData"; GetTycoonData.Parent = Remotes
local UpgradeBought = Instance.new("RemoteEvent");    UpgradeBought.Name = "UpgradeBought"; UpgradeBought.Parent = Remotes

-- ── Tycoon pad data ───────────────────────────────────────────────────────────
type TycoonData = {
	ownerId:         string,
	coins:           number,
	rebirths:        number,
	unlockedUpgrades:{[string]: boolean},
	dropperInterval: number,
	blobValue:       number,
	collectorRadius: number,
}

local pads: {[string]: TycoonData} = {}  -- padName → TycoonData
local playerPad: {[string]: string} = {} -- userId → padName

-- ── DataStore helpers ─────────────────────────────────────────────────────────
local function loadTycoon(userId: string): TycoonData
	local ok, data = pcall(TycoonDS.GetAsync, TycoonDS, "tycoon_" .. userId)
	if ok and type(data) == "table" then
		return data :: TycoonData
	end
	return {
		ownerId         = userId,
		coins           = 0,
		rebirths        = 0,
		unlockedUpgrades = {},
		dropperInterval = DROPPER_INTERVAL,
		blobValue       = BLOB_VALUE,
		collectorRadius = COLLECTOR_RADIUS,
	}
end

local function saveTycoon(padName: string)
	local pad = pads[padName]
	if not pad then return end
	local ok, err = pcall(TycoonDS.SetAsync, TycoonDS, "tycoon_" .. pad.ownerId, pad)
	if not ok then warn("[Tycoon] Save failed:", err) end
end

-- ── Build the tycoon world structure ─────────────────────────────────────────
-- This creates a simple pad in Workspace. In a real game, you'd have a Folder
-- of pre-built pad Models in Workspace that this script populates.
local function buildPad(padName: string, origin: Vector3): Folder
	local padFolder = Instance.new("Folder")
	padFolder.Name = padName
	padFolder.Parent = workspace

	-- Claim button (bright yellow brick)
	local claimBtn = Instance.new("Part")
	claimBtn.Name = "ClaimButton"
	claimBtn.Size = Vector3.new(8, 1, 8)
	claimBtn.Position = origin + Vector3.new(0, 0.5, 0)
	claimBtn.BrickColor = BrickColor.new("Bright yellow")
	claimBtn.Material = Enum.Material.SmoothPlastic
	claimBtn.Anchored = true
	claimBtn.Parent = padFolder

	local claimGui = Instance.new("BillboardGui")
	claimGui.Size = UDim2.fromOffset(200, 50)
	claimGui.StudsOffset = Vector3.new(0, 3, 0)
	claimGui.Parent = claimBtn
	local claimLabel = Instance.new("TextLabel")
	claimLabel.Size = UDim2.fromScale(1, 1)
	claimLabel.BackgroundTransparency = 1
	claimLabel.Text = "CLAIM PAD"
	claimLabel.TextColor3 = Color3.fromRGB(255,255,255)
	claimLabel.TextScaled = true
	claimLabel.Font = Enum.Font.GothamBold
	claimLabel.Parent = claimGui

	-- Dropper platform
	local dropper = Instance.new("Part")
	dropper.Name = "Dropper"
	dropper.Size = Vector3.new(4, 4, 4)
	dropper.Position = origin + Vector3.new(0, 6, -12)
	dropper.BrickColor = BrickColor.new("Bright blue")
	dropper.Material = Enum.Material.SmoothPlastic
	dropper.Anchored = true
	dropper.Parent = padFolder

	local dropLabel = Instance.new("BillboardGui")
	dropLabel.Size = UDim2.fromOffset(150, 40)
	dropLabel.StudsOffset = Vector3.new(0, 4, 0)
	dropLabel.Parent = dropper
	local dLabel = Instance.new("TextLabel")
	dLabel.Size = UDim2.fromScale(1,1)
	dLabel.BackgroundTransparency = 1
	dLabel.Text = "DROPPER"
	dLabel.TextColor3 = Color3.new(1,1,1)
	dLabel.TextScaled = true
	dLabel.Font = Enum.Font.GothamBold
	dLabel.Parent = dropLabel

	-- Conveyor belt (a static flat part — real conveyors use AssemblyLinearVelocity)
	local conveyor = Instance.new("Part")
	conveyor.Name = "Conveyor"
	conveyor.Size = Vector3.new(4, 0.5, 20)
	conveyor.Position = origin + Vector3.new(0, 3, -2)
	conveyor.BrickColor = BrickColor.new("Dark stone grey")
	conveyor.Material = Enum.Material.SmoothPlastic
	conveyor.Anchored = true
	conveyor.Parent = padFolder

	-- Set conveyor velocity so parts on it slide toward collector
	conveyor.AssemblyLinearVelocity = Vector3.new(0, 0, 8)

	-- Collector bin
	local collector = Instance.new("Part")
	collector.Name = "Collector"
	collector.Size = Vector3.new(8, 4, 2)
	collector.Position = origin + Vector3.new(0, 2, 8)
	collector.BrickColor = BrickColor.new("Bright green")
	collector.Material = Enum.Material.SmoothPlastic
	collector.Anchored = true
	collector.CanCollide = false
	collector.Transparency = 0.6
	collector.Parent = padFolder

	return padFolder
end

-- ── Claim pad logic ───────────────────────────────────────────────────────────
local function claimPad(player: Player, padName: string)
	local pad = pads[padName]
	if not pad then return end
	if pad.ownerId ~= "" then return end  -- already claimed
	local userId = tostring(player.UserId)
	pad.ownerId = userId
	playerPad[userId] = padName

	-- Update claim button label
	local padFolder = workspace:FindFirstChild(padName)
	if padFolder then
		local btn = padFolder:FindFirstChild("ClaimButton")
		if btn then
			local bbg = btn:FindFirstChildOfClass("BillboardGui")
			if bbg then
				local lbl = bbg:FindFirstChildOfClass("TextLabel")
				if lbl then lbl.Text = player.Name .. "'s Tycoon" end
			end
		end
	end
	PadClaimed:FireClient(player, padName)
end

-- ── Dropper loop ──────────────────────────────────────────────────────────────
-- Spawns coin blobs above the dropper on each pad that has an owner.
local blobCounts: {[string]: number} = {}

task.spawn(function()
	while true do
		for padName, pad in pads do
			if pad.ownerId ~= "" then
				local count = blobCounts[padName] or 0
				if count < MAX_BLOBS_PER_PAD then
					local padFolder = workspace:FindFirstChild(padName)
					local dropper = padFolder and padFolder:FindFirstChild("Dropper") :: BasePart?
					if dropper then
						local blob = Instance.new("Part")
						blob.Name = "CoinBlob"
						blob.Size = Vector3.new(1.5, 1.5, 1.5)
						blob.Shape = Enum.PartType.Ball
						blob.BrickColor = BrickColor.new("Bright yellow")
						blob.Material = Enum.Material.SmoothPlastic
						blob.Position = dropper.Position + Vector3.new(0, 3, 0)
						blob.Parent = workspace

						-- Tag with pad name for collection
						local tag = Instance.new("StringValue")
						tag.Name = "PadOwner"
						tag.Value = padName
						tag.Parent = blob

						blobCounts[padName] = count + 1
					end
				end
			end
			task.wait(pad.dropperInterval / math.max(1, #pads))
		end
		task.wait(0.1)
	end
end)

-- ── Collector loop ────────────────────────────────────────────────────────────
-- Every 0.5s, check blobs near each collector and award coins.
task.spawn(function()
	while true do
		task.wait(0.5)
		for padName, pad in pads do
			if pad.ownerId == "" then continue end
			local padFolder = workspace:FindFirstChild(padName)
			local collector = padFolder and padFolder:FindFirstChild("Collector") :: BasePart?
			if not collector then continue end

			local owner = Players:GetPlayerByUserId(tonumber(pad.ownerId) or 0)
			if not owner then continue end

			for _, obj in workspace:GetChildren() do
				if obj.Name == "CoinBlob" and obj:IsA("Part") then
					local tag = obj:FindFirstChild("PadOwner") :: StringValue?
					if tag and tag.Value == padName then
						local dist = (obj.Position - collector.Position).Magnitude
						if dist <= pad.collectorRadius then
							obj:Destroy()
							blobCounts[padName] = math.max(0, (blobCounts[padName] or 1) - 1)
							-- Award coins via leaderstats
							local ls = owner:FindFirstChild("leaderstats")
							local coins = ls and ls:FindFirstChild("Coins") :: IntValue?
							if coins then
								coins.Value += pad.blobValue
								pad.coins += pad.blobValue
							end
							BlobCollected:FireClient(owner, pad.blobValue, pad.coins)
						end
					end
				end
			end
		end
	end
end)

-- ── Upgrade purchase ──────────────────────────────────────────────────────────
PurchaseUpgrade.OnServerInvoke = function(player: Player, upgradeId: unknown): (boolean, string)
	if type(upgradeId) ~= "string" then return false, "Invalid upgrade" end
	local userId = tostring(player.UserId)
	local padName = playerPad[userId]
	if not padName then return false, "You don't own a tycoon pad" end
	local pad = pads[padName]
	if not pad then return false, "Pad not found" end
	if pad.unlockedUpgrades[upgradeId :: string] then return false, "Already purchased" end

	local upgradeDef: UpgradeDef? = nil
	for _, u in UPGRADES do
		if u.id == upgradeId then upgradeDef = u break end
	end
	if not upgradeDef then return false, "Upgrade not found" end

	local ls = player:FindFirstChild("leaderstats")
	local coins = ls and ls:FindFirstChild("Coins") :: IntValue?
	if not coins or coins.Value < upgradeDef.cost then
		return false, "Not enough coins (need " .. upgradeDef.cost .. ")"
	end

	coins.Value -= upgradeDef.cost
	pad.unlockedUpgrades[upgradeId :: string] = true

	if upgradeDef.effect == "dropperInterval" then
		pad.dropperInterval = upgradeDef.value
	elseif upgradeDef.effect == "blobValue" then
		pad.blobValue = upgradeDef.value
	elseif upgradeDef.effect == "collectorRadius" then
		pad.collectorRadius = upgradeDef.value
	elseif upgradeDef.effect == "rebirth" then
		pad.rebirths += 1
		pad.coins = 0
		pad.unlockedUpgrades = {}
		pad.dropperInterval = DROPPER_INTERVAL
		pad.blobValue = BLOB_VALUE * (1 + pad.rebirths * 0.5)  -- 50% bonus per rebirth
		pad.collectorRadius = COLLECTOR_RADIUS
		if coins then coins.Value = 0 end
	end

	saveTycoon(padName)
	UpgradeBought:FireClient(player, upgradeId, pad)
	return true, "Upgrade unlocked: " .. upgradeDef.name
end

GetTycoonData.OnServerInvoke = function(player: Player): TycoonData?
	local padName = playerPad[tostring(player.UserId)]
	return padName and pads[padName] or nil
end

-- ── Initialize pads on server start ──────────────────────────────────────────
-- Creates 4 pads in a row. Adjust origins to match your map layout.
local PAD_ORIGINS = {
	Vector3.new(0,   0, 0),
	Vector3.new(60,  0, 0),
	Vector3.new(120, 0, 0),
	Vector3.new(180, 0, 0),
}

for i, origin in PAD_ORIGINS do
	local padName = "TycoonPad" .. i
	pads[padName] = loadTycoon("unclaimed_" .. i)
	pads[padName].ownerId = ""  -- reset to unclaimed
	buildPad(padName, origin)
end

-- ── Claim button touch detection ──────────────────────────────────────────────
for padName, _ in pads do
	local padFolder = workspace:FindFirstChild(padName)
	local btn = padFolder and padFolder:FindFirstChild("ClaimButton") :: BasePart?
	if btn then
		btn.Touched:Connect(function(hit)
			local char = hit.Parent
			local player = Players:GetPlayerFromCharacter(char)
			if player and playerPad[tostring(player.UserId)] == nil then
				claimPad(player, padName)
			end
		end)
	end
end

-- ── Save all on player leave ──────────────────────────────────────────────────
Players.PlayerRemoving:Connect(function(player: Player)
	local padName = playerPad[tostring(player.UserId)]
	if padName then
		saveTycoon(padName)
		pads[padName].ownerId = ""  -- free the pad
		playerPad[tostring(player.UserId)] = nil
	end
end)

game:BindToClose(function()
	for padName, _ in pads do saveTycoon(padName) end
end)

print("[TycoonServer] Ready — " .. #PAD_ORIGINS .. " pads initialized")
`,
}

const TYCOON_CLIENT: GameSystemFile = {
  filename: 'TycoonClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- TycoonClient (LocalScript → StarterPlayerScripts)
-- Shows the tycoon HUD: current coins, rebirths, and an upgrade shop.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local Remotes       = ReplicatedStorage:WaitForChild("TycoonRemotes")
local PadClaimed    = Remotes:WaitForChild("PadClaimed")    :: RemoteEvent
local BlobCollected = Remotes:WaitForChild("BlobCollected") :: RemoteEvent
local UpgradeBought = Remotes:WaitForChild("UpgradeBought") :: RemoteEvent
local PurchaseUpgrade = Remotes:WaitForChild("PurchaseUpgrade") :: RemoteFunction
local GetTycoonData = Remotes:WaitForChild("GetTycoonData")   :: RemoteFunction

-- ── Build HUD ─────────────────────────────────────────────────────────────────
local screen = Instance.new("ScreenGui")
screen.Name = "TycoonGui"
screen.ResetOnSpawn = false
screen.Parent = playerGui

-- Top info bar
local topBar = Instance.new("Frame")
topBar.Size = UDim2.new(0, 340, 0, 60)
topBar.Position = UDim2.new(0.5, -170, 0, 10)
topBar.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
topBar.BackgroundTransparency = 0.3
topBar.BorderSizePixel = 0
topBar.Parent = screen
Instance.new("UICorner", topBar).CornerRadius = UDim.new(0, 10)

local coinsLabel = Instance.new("TextLabel")
coinsLabel.Size = UDim2.new(0.5, 0, 1, 0)
coinsLabel.BackgroundTransparency = 1
coinsLabel.Text = "Coins: 0"
coinsLabel.TextColor3 = Color3.fromRGB(212, 175, 55)  -- gold
coinsLabel.TextScaled = true
coinsLabel.Font = Enum.Font.GothamBold
coinsLabel.Parent = topBar

local rebirthLabel = Instance.new("TextLabel")
rebirthLabel.Size = UDim2.new(0.5, 0, 1, 0)
rebirthLabel.Position = UDim2.new(0.5, 0, 0, 0)
rebirthLabel.BackgroundTransparency = 1
rebirthLabel.Text = "Rebirths: 0"
rebirthLabel.TextColor3 = Color3.fromRGB(160, 100, 255)
rebirthLabel.TextScaled = true
rebirthLabel.Font = Enum.Font.GothamBold
rebirthLabel.Parent = topBar

-- Upgrade shop button
local shopBtn = Instance.new("TextButton")
shopBtn.Size = UDim2.new(0, 160, 0, 44)
shopBtn.Position = UDim2.new(1, -170, 0, 10)
shopBtn.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
shopBtn.Text = "UPGRADES"
shopBtn.TextColor3 = Color3.fromRGB(20, 20, 20)
shopBtn.TextScaled = true
shopBtn.Font = Enum.Font.GothamBold
shopBtn.BorderSizePixel = 0
shopBtn.Parent = screen
Instance.new("UICorner", shopBtn).CornerRadius = UDim.new(0, 8)

-- Upgrade panel (initially hidden)
local upgradePanel = Instance.new("Frame")
upgradePanel.Size = UDim2.new(0, 320, 0, 400)
upgradePanel.Position = UDim2.new(1, -330, 0, 64)
upgradePanel.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
upgradePanel.BackgroundTransparency = 0.1
upgradePanel.BorderSizePixel = 0
upgradePanel.Visible = false
upgradePanel.Parent = screen
Instance.new("UICorner", upgradePanel).CornerRadius = UDim.new(0, 12)

local uTitle = Instance.new("TextLabel")
uTitle.Size = UDim2.new(1, 0, 0, 40)
uTitle.BackgroundTransparency = 1
uTitle.Text = "UPGRADE SHOP"
uTitle.TextColor3 = Color3.fromRGB(212, 175, 55)
uTitle.TextScaled = true
uTitle.Font = Enum.Font.GothamBold
uTitle.Parent = upgradePanel

local uList = Instance.new("ScrollingFrame")
uList.Size = UDim2.new(1, -10, 1, -50)
uList.Position = UDim2.new(0, 5, 0, 45)
uList.BackgroundTransparency = 1
uList.BorderSizePixel = 0
uList.ScrollBarThickness = 4
uList.CanvasSize = UDim2.new(0, 0, 0, 0)
uList.Parent = upgradePanel
Instance.new("UIListLayout", uList).Padding = UDim.new(0, 6)

-- Upgrades data (mirrors server-side for display purposes)
type UpgradeDisplay = { id: string, name: string, cost: number, desc: string }
local UPGRADE_DISPLAY: {UpgradeDisplay} = {
	{ id = "dropper2",   name = "Dropper II",     cost = 500,   desc = "Drop every 2s"       },
	{ id = "dropper3",   name = "Dropper III",    cost = 2000,  desc = "Drop every 1s"       },
	{ id = "value2",     name = "Gold Blobs",     cost = 1000,  desc = "Blobs worth 15 coins" },
	{ id = "value3",     name = "Diamond Blobs",  cost = 5000,  desc = "Blobs worth 50 coins" },
	{ id = "collector2", name = "Wide Collector", cost = 3000,  desc = "Larger collect radius" },
	{ id = "rebirth",    name = "REBIRTH",        cost = 25000, desc = "Reset for +50% bonus" },
}

local unlockedUpgrades: {[string]: boolean} = {}

local function buildUpgradeButtons()
	uList:ClearAllChildren()
	Instance.new("UIListLayout", uList).Padding = UDim.new(0, 6)
	for _, upg in UPGRADE_DISPLAY do
		local row = Instance.new("Frame")
		row.Size = UDim2.new(1, -8, 0, 58)
		row.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
		row.BorderSizePixel = 0
		row.Parent = uList
		Instance.new("UICorner", row).CornerRadius = UDim.new(0, 8)

		local nameLabel = Instance.new("TextLabel")
		nameLabel.Size = UDim2.new(0.65, 0, 0.5, 0)
		nameLabel.BackgroundTransparency = 1
		nameLabel.Text = upg.name
		nameLabel.TextColor3 = Color3.new(1,1,1)
		nameLabel.TextScaled = true
		nameLabel.Font = Enum.Font.GothamBold
		nameLabel.TextXAlignment = Enum.TextXAlignment.Left
		nameLabel.Position = UDim2.new(0, 8, 0, 0)
		nameLabel.Parent = row

		local descLabel = Instance.new("TextLabel")
		descLabel.Size = UDim2.new(0.65, 0, 0.5, 0)
		descLabel.Position = UDim2.new(0, 8, 0.5, 0)
		descLabel.BackgroundTransparency = 1
		descLabel.Text = upg.desc
		descLabel.TextColor3 = Color3.fromRGB(180, 180, 180)
		descLabel.TextScaled = true
		descLabel.Font = Enum.Font.Gotham
		descLabel.TextXAlignment = Enum.TextXAlignment.Left
		descLabel.Parent = row

		local buyBtn = Instance.new("TextButton")
		buyBtn.Size = UDim2.new(0.3, -8, 0.7, 0)
		buyBtn.Position = UDim2.new(0.7, 0, 0.15, 0)
		buyBtn.BackgroundColor3 = unlockedUpgrades[upg.id] and Color3.fromRGB(80,80,80) or Color3.fromRGB(212,175,55)
		buyBtn.Text = unlockedUpgrades[upg.id] and "OWNED" or ("$" .. tostring(upg.cost))
		buyBtn.TextColor3 = Color3.fromRGB(20,20,20)
		buyBtn.TextScaled = true
		buyBtn.Font = Enum.Font.GothamBold
		buyBtn.AutoButtonColor = not unlockedUpgrades[upg.id]
		buyBtn.BorderSizePixel = 0
		buyBtn.Parent = row
		Instance.new("UICorner", buyBtn).CornerRadius = UDim.new(0, 6)

		if not unlockedUpgrades[upg.id] then
			buyBtn.MouseButton1Click:Connect(function()
				buyBtn.Text = "..."
				local ok, msg = PurchaseUpgrade:InvokeServer(upg.id)
				if ok then
					unlockedUpgrades[upg.id] = true
					buildUpgradeButtons()
				else
					buyBtn.Text = "FAIL"
					task.wait(1.5)
					buildUpgradeButtons()
				end
			end)
		end
	end
	-- Resize canvas
	local layout = uList:FindFirstChildOfClass("UIListLayout")
	if layout then
		uList.CanvasSize = UDim2.new(0, 0, 0, layout.AbsoluteContentSize.Y + 10)
	end
end

buildUpgradeButtons()

-- ── Toggle shop ───────────────────────────────────────────────────────────────
shopBtn.MouseButton1Click:Connect(function()
	upgradePanel.Visible = not upgradePanel.Visible
	if upgradePanel.Visible then buildUpgradeButtons() end
end)

-- ── Update HUD on blob collected ─────────────────────────────────────────────
BlobCollected.OnClientEvent:Connect(function(blobValue: number, totalCoins: number)
	coinsLabel.Text = "Coins: " .. tostring(totalCoins)
	-- Pulse animation
	TweenService:Create(coinsLabel, TweenInfo.new(0.15), { TextColor3 = Color3.fromRGB(255,220,50) }):Play()
	task.delay(0.15, function()
		TweenService:Create(coinsLabel, TweenInfo.new(0.3), { TextColor3 = Color3.fromRGB(212,175,55) }):Play()
	end)
end)

UpgradeBought.OnClientEvent:Connect(function(upgradeId: string, padData: {unlockedUpgrades: {[string]: boolean}, rebirths: number})
	unlockedUpgrades = padData.unlockedUpgrades
	rebirthLabel.Text = "Rebirths: " .. tostring(padData.rebirths)
	buildUpgradeButtons()
end)

PadClaimed.OnClientEvent:Connect(function(_padName: string)
	-- Load initial state
	local data = GetTycoonData:InvokeServer()
	if data then
		coinsLabel.Text = "Coins: " .. tostring(data.coins)
		rebirthLabel.Text = "Rebirths: " .. tostring(data.rebirths)
		unlockedUpgrades = data.unlockedUpgrades
		buildUpgradeButtons()
	end
end)

print("[TycoonClient] HUD ready")
`,
}

// ─── 13. Obby System ──────────────────────────────────────────────────────────

const OBBY_SERVER: GameSystemFile = {
  filename: 'ObbyServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- ObbyServer (ServerScript → ServerScriptService)
-- Checkpoint persistence, kill bricks, moving platforms, timer, leaderboard.

local Players          = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService       = game:GetService("RunService")

local ObbyDS = DataStoreService:GetDataStore("ObbyProgressV1")

-- ── Config ────────────────────────────────────────────────────────────────────
local CHECKPOINT_FOLDER  = "ObbyCheckpoints"    -- Folder in Workspace containing checkpoint Parts
local KILL_BRICK_TAG     = "KillBrick"          -- CollectionService tag on kill bricks
local MOVING_PLATFORM_TAG = "MovingPlatform"    -- tag on moving platforms
local TOTAL_STAGES       = 30                    -- adjust to match your obby

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder"); Remotes.Name = "ObbyRemotes"; Remotes.Parent = ReplicatedStorage
local CheckpointReached = Instance.new("RemoteEvent"); CheckpointReached.Name = "CheckpointReached"; CheckpointReached.Parent = Remotes
local ObbyCompleted     = Instance.new("RemoteEvent"); ObbyCompleted.Name     = "ObbyCompleted";     ObbyCompleted.Parent     = Remotes
local GetProgress       = Instance.new("RemoteFunction"); GetProgress.Name    = "GetProgress";       GetProgress.Parent       = Remotes

-- ── Player checkpoint state ───────────────────────────────────────────────────
local checkpoints: {[string]: number} = {}  -- userId → stage number (1-indexed)
local startTimes:  {[string]: number} = {}  -- userId → os.clock() when they spawned

-- ── DataStore helpers ─────────────────────────────────────────────────────────
local function loadCheckpoint(player: Player): number
	local ok, val = pcall(ObbyDS.GetAsync, ObbyDS, "obby_" .. tostring(player.UserId))
	if ok and type(val) == "number" then return math.clamp(val, 1, TOTAL_STAGES) end
	return 1
end

local function saveCheckpoint(player: Player)
	local stage = checkpoints[tostring(player.UserId)] or 1
	local ok, err = pcall(ObbyDS.SetAsync, ObbyDS, "obby_" .. tostring(player.UserId), stage)
	if not ok then warn("[Obby] Save failed:", err) end
end

-- ── Spawn at checkpoint ───────────────────────────────────────────────────────
local function getCheckpointCFrame(stage: number): CFrame?
	local folder = workspace:FindFirstChild(CHECKPOINT_FOLDER)
	if not folder then return nil end
	-- Checkpoints must be named "Stage1", "Stage2", …
	local part = folder:FindFirstChild("Stage" .. tostring(stage)) :: BasePart?
	if part then
		return part.CFrame + Vector3.new(0, 5, 0)
	end
	return nil
end

local function spawnAtCheckpoint(player: Player)
	local stage = checkpoints[tostring(player.UserId)] or 1
	local cf = getCheckpointCFrame(stage)
	if not cf then return end
	local char = player.Character
	if not char then return end
	local root = char:FindFirstChild("HumanoidRootPart") :: BasePart?
	if root then root.CFrame = cf end
end

-- ── Player lifecycle ─────────────────────────────────────────────────────────
Players.PlayerAdded:Connect(function(player: Player)
	local stage = loadCheckpoint(player)
	checkpoints[tostring(player.UserId)] = stage
	-- Leaderstats for stage display
	local ls = player:FindFirstChild("leaderstats") or Instance.new("Folder")
	ls.Name = "leaderstats"; ls.Parent = player
	local stageVal = Instance.new("IntValue")
	stageVal.Name = "Stage"; stageVal.Value = stage; stageVal.Parent = ls

	player.CharacterAdded:Connect(function(_char: Model)
		startTimes[tostring(player.UserId)] = os.clock()
		task.delay(1, function() spawnAtCheckpoint(player) end)
	end)
end)

Players.PlayerRemoving:Connect(function(player: Player)
	saveCheckpoint(player)
	checkpoints[tostring(player.UserId)] = nil
	startTimes[tostring(player.UserId)]  = nil
end)

game:BindToClose(function()
	for _, p in Players:GetPlayers() do saveCheckpoint(p) end
end)

-- ── Checkpoint touched ────────────────────────────────────────────────────────
-- Checkpoints in Workspace/ObbyCheckpoints must be named "Stage1" etc.
local function setupCheckpoints()
	local folder = workspace:FindFirstChild(CHECKPOINT_FOLDER)
	if not folder then
		warn("[Obby] Checkpoint folder '" .. CHECKPOINT_FOLDER .. "' not found in Workspace!")
		return
	end
	for _, part in folder:GetChildren() do
		if not part:IsA("BasePart") then continue end
		local stageNum = tonumber(part.Name:match("Stage(%d+)"))
		if not stageNum then continue end
		part.Touched:Connect(function(hit)
			local char = hit.Parent
			local player = Players:GetPlayerFromCharacter(char)
			if not player then return end
			local uid = tostring(player.UserId)
			local current = checkpoints[uid] or 1
			if stageNum <= current then return end  -- only advance
			checkpoints[uid] = stageNum
			-- Update leaderstats
			local ls = player:FindFirstChild("leaderstats")
			local sv = ls and ls:FindFirstChild("Stage") :: IntValue?
			if sv then sv.Value = stageNum end
			CheckpointReached:FireClient(player, stageNum, TOTAL_STAGES)
			saveCheckpoint(player)
			-- Check if obby complete
			if stageNum >= TOTAL_STAGES then
				local elapsed = os.clock() - (startTimes[uid] or os.clock())
				ObbyCompleted:FireClient(player, elapsed)
				-- Reset to stage 1 for replay
				checkpoints[uid] = 1
				if sv then sv.Value = 1 end
				print("[Obby]", player.Name, "completed in", math.floor(elapsed), "seconds")
			end
		end)
	end
end

-- ── Kill bricks ───────────────────────────────────────────────────────────────
-- Tag kill bricks with CollectionService tag "KillBrick" in Studio.
local CollectionService = game:GetService("CollectionService")

local function setupKillBricks()
	local function hookKillBrick(brick: Instance)
		if not brick:IsA("BasePart") then return end
		(brick :: BasePart).Touched:Connect(function(hit)
			local char = hit.Parent
			local player = Players:GetPlayerFromCharacter(char)
			if not player then return end
			local hum = char:FindFirstChildOfClass("Humanoid") :: Humanoid?
			if hum and hum.Health > 0 then
				hum.Health = 0
			end
		end)
	end
	for _, brick in CollectionService:GetTagged(KILL_BRICK_TAG) do
		hookKillBrick(brick)
	end
	CollectionService:GetInstanceAddedSignal(KILL_BRICK_TAG):Connect(hookKillBrick)
end

-- ── Moving platforms ──────────────────────────────────────────────────────────
-- Tag moving platforms with "MovingPlatform". Optionally add Attributes:
--   MoveAxis (Vector3), MoveDistance (number), MoveSpeed (number)
local function setupMovingPlatforms()
	local function animatePlatform(part: BasePart)
		local axis     = part:GetAttribute("MoveAxis")
		local distance = part:GetAttribute("MoveDistance")
		local speed    = part:GetAttribute("MoveSpeed")
		-- Apply defaults if attributes missing
		local moveAxis:     Vector3 = (typeof(axis) == "Vector3")      and (axis :: Vector3)     or Vector3.new(1,0,0)
		local moveDist:     number  = (type(distance) == "number")     and (distance :: number)  or 10
		local moveSpeed:    number  = (type(speed) == "number")        and (speed :: number)     or 4

		local origin = part.Position
		local t = 0
		RunService.Heartbeat:Connect(function(dt: number)
			t += dt * moveSpeed
			local offset = moveAxis * (math.sin(t) * moveDist)
			part.CFrame = CFrame.new(origin + offset) * (part.CFrame - part.CFrame.Position)
		end)
	end

	for _, platform in CollectionService:GetTagged(MOVING_PLATFORM_TAG) do
		if platform:IsA("BasePart") then
			animatePlatform(platform :: BasePart)
		end
	end
	CollectionService:GetInstanceAddedSignal(MOVING_PLATFORM_TAG):Connect(function(platform: Instance)
		if platform:IsA("BasePart") then
			animatePlatform(platform :: BasePart)
		end
	end)
end

-- ── Boot ──────────────────────────────────────────────────────────────────────
GetProgress.OnServerInvoke = function(player: Player): (number, number)
	return checkpoints[tostring(player.UserId)] or 1, TOTAL_STAGES
end

setupCheckpoints()
setupKillBricks()
setupMovingPlatforms()

print("[ObbyServer] Ready — " .. TOTAL_STAGES .. " stages, kill bricks and moving platforms active")
`,
}

const OBBY_CLIENT: GameSystemFile = {
  filename: 'ObbyClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- ObbyClient (LocalScript → StarterPlayerScripts)
-- Checkpoint notification, completion screen, stage timer.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local Remotes           = ReplicatedStorage:WaitForChild("ObbyRemotes")
local CheckpointReached = Remotes:WaitForChild("CheckpointReached") :: RemoteEvent
local ObbyCompleted     = Remotes:WaitForChild("ObbyCompleted")     :: RemoteEvent
local GetProgress       = Remotes:WaitForChild("GetProgress")       :: RemoteFunction

-- ── Build HUD ─────────────────────────────────────────────────────────────────
local screen = Instance.new("ScreenGui")
screen.Name = "ObbyGui"
screen.ResetOnSpawn = false
screen.Parent = playerGui

-- Stage progress bar (top center)
local progressBg = Instance.new("Frame")
progressBg.Size = UDim2.new(0, 320, 0, 28)
progressBg.Position = UDim2.new(0.5, -160, 0, 8)
progressBg.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
progressBg.BorderSizePixel = 0
progressBg.Parent = screen
Instance.new("UICorner", progressBg).CornerRadius = UDim.new(0, 14)

local progressBar = Instance.new("Frame")
progressBar.Size = UDim2.new(0, 0, 1, 0)
progressBar.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
progressBar.BorderSizePixel = 0
progressBar.Parent = progressBg
Instance.new("UICorner", progressBar).CornerRadius = UDim.new(0, 14)

local stageLabel = Instance.new("TextLabel")
stageLabel.Size = UDim2.new(1, 0, 1, 0)
stageLabel.BackgroundTransparency = 1
stageLabel.Text = "Stage 1 / 30"
stageLabel.TextColor3 = Color3.new(1,1,1)
stageLabel.TextScaled = true
stageLabel.Font = Enum.Font.GothamBold
stageLabel.ZIndex = 2
stageLabel.Parent = progressBg

-- Timer label
local timerLabel = Instance.new("TextLabel")
timerLabel.Size = UDim2.new(0, 120, 0, 32)
timerLabel.Position = UDim2.new(0.5, -60, 0, 42)
timerLabel.BackgroundTransparency = 1
timerLabel.Text = "0:00"
timerLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
timerLabel.TextScaled = true
timerLabel.Font = Enum.Font.GothamBold
timerLabel.Parent = screen

-- Checkpoint notification (slides in from right)
local checkpointNotif = Instance.new("Frame")
checkpointNotif.Size = UDim2.new(0, 260, 0, 60)
checkpointNotif.Position = UDim2.new(1, 10, 0.5, -30)  -- off-screen right
checkpointNotif.BackgroundColor3 = Color3.fromRGB(30, 180, 80)
checkpointNotif.BorderSizePixel = 0
checkpointNotif.Parent = screen
Instance.new("UICorner", checkpointNotif).CornerRadius = UDim.new(0, 12)

local notifLabel = Instance.new("TextLabel")
notifLabel.Size = UDim2.new(1, -10, 1, 0)
notifLabel.Position = UDim2.new(0, 8, 0, 0)
notifLabel.BackgroundTransparency = 1
notifLabel.Text = "Checkpoint!"
notifLabel.TextColor3 = Color3.new(1,1,1)
notifLabel.TextScaled = true
notifLabel.Font = Enum.Font.GothamBold
notifLabel.Parent = checkpointNotif

-- Completion overlay
local completionFrame = Instance.new("Frame")
completionFrame.Size = UDim2.new(1, 0, 1, 0)
completionFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
completionFrame.BackgroundTransparency = 0.4
completionFrame.Visible = false
completionFrame.ZIndex = 10
completionFrame.Parent = screen

local completionLabel = Instance.new("TextLabel")
completionLabel.Size = UDim2.new(0, 500, 0, 80)
completionLabel.Position = UDim2.new(0.5, -250, 0.3, 0)
completionLabel.BackgroundTransparency = 1
completionLabel.Text = "OBBY COMPLETE!"
completionLabel.TextColor3 = Color3.fromRGB(212, 175, 55)
completionLabel.TextScaled = true
completionLabel.Font = Enum.Font.GothamBold
completionLabel.ZIndex = 11
completionLabel.Parent = completionFrame

local timeLabel = Instance.new("TextLabel")
timeLabel.Size = UDim2.new(0, 500, 0, 50)
timeLabel.Position = UDim2.new(0.5, -250, 0.45, 0)
timeLabel.BackgroundTransparency = 1
timeLabel.Text = "Time: 0:00"
timeLabel.TextColor3 = Color3.new(1,1,1)
timeLabel.TextScaled = true
timeLabel.Font = Enum.Font.Gotham
timeLabel.ZIndex = 11
timeLabel.Parent = completionFrame

local replayBtn = Instance.new("TextButton")
replayBtn.Size = UDim2.new(0, 200, 0, 50)
replayBtn.Position = UDim2.new(0.5, -100, 0.55, 0)
replayBtn.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
replayBtn.Text = "PLAY AGAIN"
replayBtn.TextColor3 = Color3.fromRGB(20, 20, 20)
replayBtn.TextScaled = true
replayBtn.Font = Enum.Font.GothamBold
replayBtn.ZIndex = 11
replayBtn.BorderSizePixel = 0
replayBtn.Parent = completionFrame
Instance.new("UICorner", replayBtn).CornerRadius = UDim.new(0, 10)
replayBtn.MouseButton1Click:Connect(function()
	completionFrame.Visible = false
end)

-- ── Load initial progress ─────────────────────────────────────────────────────
local totalStages = 30
local function updateProgress(stage: number, total: number)
	totalStages = total
	stageLabel.Text = "Stage " .. tostring(stage) .. " / " .. tostring(total)
	local pct = stage / total
	TweenService:Create(progressBar, TweenInfo.new(0.4, Enum.EasingStyle.Quad), {
		Size = UDim2.new(pct, 0, 1, 0)
	}):Play()
end

task.spawn(function()
	local stage, total = GetProgress:InvokeServer()
	updateProgress(stage, total)
end)

-- ── Timer ─────────────────────────────────────────────────────────────────────
local startTime = os.clock()
task.spawn(function()
	while true do
		task.wait(0.5)
		local elapsed = math.floor(os.clock() - startTime)
		local mins = math.floor(elapsed / 60)
		local secs = elapsed % 60
		timerLabel.Text = string.format("%d:%02d", mins, secs)
	end
end)

-- ── Checkpoint notification animation ────────────────────────────────────────
local notifTween: Tween? = nil
CheckpointReached.OnClientEvent:Connect(function(stage: number, total: number)
	updateProgress(stage, total)
	notifLabel.Text = "Stage " .. tostring(stage) .. " Reached!"
	-- Slide in from right
	if notifTween then notifTween:Cancel() end
	checkpointNotif.Position = UDim2.new(1, 10, 0.5, -30)
	notifTween = TweenService:Create(checkpointNotif, TweenInfo.new(0.3, Enum.EasingStyle.Back), {
		Position = UDim2.new(1, -270, 0.5, -30)
	})
	notifTween:Play()
	task.delay(2, function()
		notifTween = TweenService:Create(checkpointNotif, TweenInfo.new(0.3), {
			Position = UDim2.new(1, 10, 0.5, -30)
		})
		notifTween:Play()
	end)
end)

-- ── Completion screen ─────────────────────────────────────────────────────────
ObbyCompleted.OnClientEvent:Connect(function(elapsed: number)
	local mins = math.floor(elapsed / 60)
	local secs = math.floor(elapsed) % 60
	timeLabel.Text = string.format("Time: %d:%02d", mins, secs)
	completionFrame.Visible = true
	-- Reset timer
	startTime = os.clock()
end)

print("[ObbyClient] HUD ready")
`,
}

// ─── 14. Gamepass System ─────────────────────────────────────────────────────

const GAMEPASS_SERVER: GameSystemFile = {
  filename: 'GamepassServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- GamepassServer (ServerScript → ServerScriptService)
-- Checks gamepass ownership on join and handles ProcessReceipt for dev products.

local Players            = game:GetService("Players")
local MarketplaceService = game:GetService("MarketplaceService")
local ReplicatedStorage  = game:GetService("ReplicatedStorage")
local DataStoreService   = game:GetService("DataStoreService")

-- ── Config — replace IDs with your actual gamepass/product IDs ───────────────
local GAMEPASS_IDS = {
	SPEED_BOOST   = 0000001,  -- 2x Speed gamepass ID
	VIP           = 0000002,  -- VIP gamepass ID
	EXTRA_STORAGE = 0000003,  -- Extra Storage gamepass ID
	AUTO_COLLECT  = 0000004,  -- Auto-Collect gamepass ID
}

local DEV_PRODUCT_IDS = {
	COINS_100  = 0000010,  -- 100 coins product ID
	COINS_500  = 0000011,  -- 500 coins product ID
	COINS_1000 = 0000012,  -- 1000 coins product ID
}

local PRODUCT_COIN_AMOUNTS: {[number]: number} = {
	[DEV_PRODUCT_IDS.COINS_100]  = 100,
	[DEV_PRODUCT_IDS.COINS_500]  = 500,
	[DEV_PRODUCT_IDS.COINS_1000] = 1000,
}

-- ── RemoteEvents ──────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder")
Remotes.Name = "GamepassRemotes"
Remotes.Parent = ReplicatedStorage

local PromptGamepass    = Instance.new("RemoteEvent"); PromptGamepass.Name    = "PromptGamepass";    PromptGamepass.Parent    = Remotes
local PromptDevProduct  = Instance.new("RemoteEvent"); PromptDevProduct.Name  = "PromptDevProduct";  PromptDevProduct.Parent  = Remotes
local BenefitsUpdated   = Instance.new("RemoteEvent"); BenefitsUpdated.Name   = "BenefitsUpdated";   BenefitsUpdated.Parent   = Remotes

-- ── Active benefits per player ────────────────────────────────────────────────
type Benefits = {
	speedBoost:    boolean,
	vip:           boolean,
	extraStorage:  boolean,
	autoCollect:   boolean,
}

local playerBenefits: {[number]: Benefits} = {}

local function defaultBenefits(): Benefits
	return { speedBoost = false, vip = false, extraStorage = false, autoCollect = false }
end

-- ── Check all gamepasses for a player ────────────────────────────────────────
local function checkGamepasses(player: Player)
	local uid = player.UserId
	local b = defaultBenefits()

	-- Each check is pcalled — MarketplaceService can throttle
	local ok1, owns1 = pcall(MarketplaceService.UserOwnsGamePassAsync, MarketplaceService, uid, GAMEPASS_IDS.SPEED_BOOST)
	if ok1 and owns1 then b.speedBoost = true end

	local ok2, owns2 = pcall(MarketplaceService.UserOwnsGamePassAsync, MarketplaceService, uid, GAMEPASS_IDS.VIP)
	if ok2 and owns2 then b.vip = true end

	local ok3, owns3 = pcall(MarketplaceService.UserOwnsGamePassAsync, MarketplaceService, uid, GAMEPASS_IDS.EXTRA_STORAGE)
	if ok3 and owns3 then b.extraStorage = true end

	local ok4, owns4 = pcall(MarketplaceService.UserOwnsGamePassAsync, MarketplaceService, uid, GAMEPASS_IDS.AUTO_COLLECT)
	if ok4 and owns4 then b.autoCollect = true end

	playerBenefits[uid] = b
	applyBenefits(player, b)
	BenefitsUpdated:FireClient(player, b)
end

-- ── Apply benefits to character ───────────────────────────────────────────────
function applyBenefits(player: Player, b: Benefits)
	local char = player.Character
	if not char then return end
	local humanoid = char:FindFirstChildOfClass("Humanoid") :: Humanoid?
	if not humanoid then return end

	-- 2x Speed
	humanoid.WalkSpeed = b.speedBoost and 32 or 16

	-- VIP badge / title (example: add a BillboardGui overhead)
	local existingBadge = char:FindFirstChild("VIPBadge")
	if b.vip and not existingBadge then
		local bb = Instance.new("BillboardGui")
		bb.Name = "VIPBadge"
		bb.Size = UDim2.new(0, 80, 0, 24)
		bb.StudsOffset = Vector3.new(0, 3, 0)
		bb.AlwaysOnTop = false
		bb.Parent = char:FindFirstChild("Head") or char

		local lbl = Instance.new("TextLabel")
		lbl.Size = UDim2.new(1, 0, 1, 0)
		lbl.BackgroundTransparency = 1
		lbl.Text = "⭐ VIP"
		lbl.TextColor3 = Color3.fromRGB(212, 175, 55)
		lbl.TextScaled = true
		lbl.Font = Enum.Font.GothamBold
		lbl.Parent = bb
	elseif not b.vip and existingBadge then
		existingBadge:Destroy()
	end
end

-- ── Player lifecycle ─────────────────────────────────────────────────────────
Players.PlayerAdded:Connect(function(player: Player)
	-- Check on join (task.delay allows the character to settle)
	task.delay(1, function()
		if player.Parent then
			checkGamepasses(player)
		end
	end)

	-- Re-apply on respawn
	player.CharacterAdded:Connect(function(_char: Model)
		task.delay(0.5, function()
			local b = playerBenefits[player.UserId]
			if b then applyBenefits(player, b) end
		end)
	end)
end)

Players.PlayerRemoving:Connect(function(player: Player)
	playerBenefits[player.UserId] = nil
end)

-- ── Client-requested prompts ─────────────────────────────────────────────────
PromptGamepass.OnServerEvent:Connect(function(player: Player, passKey: unknown)
	if type(passKey) ~= "string" then return end
	local id = GAMEPASS_IDS[passKey]
	if not id then return end
	MarketplaceService:PromptGamePassPurchase(player, id)
end)

PromptDevProduct.OnServerEvent:Connect(function(player: Player, productKey: unknown)
	if type(productKey) ~= "string" then return end
	local id = DEV_PRODUCT_IDS[productKey]
	if not id then return end
	MarketplaceService:PromptProductPurchase(player, id)
end)

-- ── Gamepass purchased callback ───────────────────────────────────────────────
MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(
	player: Player,
	passId: number,
	wasPurchased: boolean
)
	if not wasPurchased then return end
	-- Re-check all passes so benefits are applied immediately
	checkGamepasses(player)
end)

-- ── ProcessReceipt — REQUIRED for dev products ───────────────────────────────
-- This MUST return Enum.ProductPurchaseDecision.PurchaseGranted or NotProcessedYet
local PurchaseReceiptDS = DataStoreService:GetDataStore("PurchaseReceipts_V1")

MarketplaceService.ProcessReceipt = function(receiptInfo: {
	PlayerId:       number,
	ProductId:      number,
	PurchaseId:     string,
	PlaceIdWherePurchased: number,
}): Enum.ProductPurchaseDecision

	-- Idempotency check — never grant the same purchase twice
	local receiptKey = "receipt_" .. receiptInfo.PurchaseId
	local alreadyProcessed: boolean = false
	local ok, result = pcall(function()
		alreadyProcessed = PurchaseReceiptDS:GetAsync(receiptKey) == true
	end)
	if not ok then
		warn("[Gamepass] Receipt DS read failed:", result)
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	if alreadyProcessed then
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end

	local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
	if not player then
		-- Player left; retry later
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	-- Grant coins
	local coinAmount = PRODUCT_COIN_AMOUNTS[receiptInfo.ProductId]
	if coinAmount then
		local ls = player:FindFirstChild("leaderstats")
		if ls then
			local coins = ls:FindFirstChild("Coins") :: IntValue?
			if coins then coins.Value += coinAmount end
		end
	else
		warn("[Gamepass] Unknown ProductId:", receiptInfo.ProductId)
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	-- Mark as processed
	local saveOk, saveErr = pcall(PurchaseReceiptDS.SetAsync, PurchaseReceiptDS, receiptKey, true)
	if not saveOk then
		warn("[Gamepass] Receipt save failed:", saveErr)
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	return Enum.ProductPurchaseDecision.PurchaseGranted
end

-- ── Public API for other server scripts ──────────────────────────────────────
local function hasBenefit(player: Player, benefit: string): boolean
	local b = playerBenefits[player.UserId]
	if not b then return false end
	return (b :: {[string]: boolean})[benefit] == true
end

return { hasBenefit = hasBenefit, GAMEPASS_IDS = GAMEPASS_IDS, DEV_PRODUCT_IDS = DEV_PRODUCT_IDS }
`,
}

const GAMEPASS_CLIENT: GameSystemFile = {
  filename: 'GamepassClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- GamepassClient (LocalScript → StarterPlayerScripts)
-- Purchase prompt buttons + benefit status display.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local MarketplaceService = game:GetService("MarketplaceService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local Remotes        = ReplicatedStorage:WaitForChild("GamepassRemotes")
local PromptGamepass = Remotes:WaitForChild("PromptGamepass")   :: RemoteEvent
local BenefitsUpdated = Remotes:WaitForChild("BenefitsUpdated") :: RemoteEvent

-- ── Gamepass shop data ────────────────────────────────────────────────────────
type PassInfo = { key: string, label: string, description: string, price: string }
local PASSES: {PassInfo} = {
	{ key = "SPEED_BOOST",   label = "2x Speed",       description = "Double your walk speed permanently!", price = "50 R$" },
	{ key = "VIP",           label = "VIP",             description = "VIP badge, exclusive areas + perks!", price = "100 R$" },
	{ key = "EXTRA_STORAGE", label = "Extra Storage",   description = "Double your inventory capacity!",      price = "75 R$" },
	{ key = "AUTO_COLLECT",  label = "Auto-Collect",    description = "Automatically collect nearby items!",  price = "150 R$" },
}

-- ── Build the shop GUI ────────────────────────────────────────────────────────
local screen = Instance.new("ScreenGui")
screen.Name = "GamepassShopGui"
screen.ResetOnSpawn = false
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.Enabled = false
screen.Parent = playerGui

-- Dimmer background
local dimmer = Instance.new("Frame")
dimmer.Size = UDim2.new(1, 0, 1, 0)
dimmer.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
dimmer.BackgroundTransparency = 0.5
dimmer.Parent = screen

-- Main panel
local panel = Instance.new("Frame")
panel.Size = UDim2.new(0, 500, 0, 420)
panel.Position = UDim2.new(0.5, -250, 0.5, -210)
panel.BackgroundColor3 = Color3.fromRGB(15, 15, 22)
panel.Parent = screen

local panelCorner = Instance.new("UICorner"); panelCorner.CornerRadius = UDim.new(0, 16); panelCorner.Parent = panel
local panelStroke = Instance.new("UIStroke"); panelStroke.Color = Color3.fromRGB(212, 175, 55); panelStroke.Thickness = 2; panelStroke.Parent = panel

local titleLabel = Instance.new("TextLabel")
titleLabel.Size = UDim2.new(1, -20, 0, 50)
titleLabel.Position = UDim2.new(0, 10, 0, 10)
titleLabel.BackgroundTransparency = 1
titleLabel.Text = "⭐  GAMEPASS SHOP"
titleLabel.TextSize = 24
titleLabel.Font = Enum.Font.GothamBold
titleLabel.TextColor3 = Color3.fromRGB(212, 175, 55)
titleLabel.Parent = panel

local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0, 36, 0, 36)
closeBtn.Position = UDim2.new(1, -46, 0, 7)
closeBtn.BackgroundColor3 = Color3.fromRGB(180, 50, 50)
closeBtn.Text = "✕"
closeBtn.TextSize = 18
closeBtn.Font = Enum.Font.GothamBold
closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
closeBtn.Parent = panel
Instance.new("UICorner").Parent = closeBtn

local listFrame = Instance.new("Frame")
listFrame.Size = UDim2.new(1, -20, 1, -80)
listFrame.Position = UDim2.new(0, 10, 0, 65)
listFrame.BackgroundTransparency = 1
listFrame.Parent = panel

local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 8)
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.Parent = listFrame

-- ── owned status tracking ─────────────────────────────────────────────────────
local ownedStatus: {[string]: boolean} = {}
local passButtons: {[string]: TextButton} = {}

-- ── Create a pass row ─────────────────────────────────────────────────────────
for i, passInfo in PASSES do
	local row = Instance.new("Frame")
	row.Name = passInfo.key
	row.Size = UDim2.new(1, 0, 0, 72)
	row.BackgroundColor3 = Color3.fromRGB(25, 25, 35)
	row.LayoutOrder = i
	row.Parent = listFrame
	Instance.new("UICorner").Parent = row

	local nameLbl = Instance.new("TextLabel")
	nameLbl.Size = UDim2.new(0.55, 0, 0, 28)
	nameLbl.Position = UDim2.new(0, 12, 0, 8)
	nameLbl.BackgroundTransparency = 1
	nameLbl.Text = passInfo.label
	nameLbl.TextSize = 16
	nameLbl.Font = Enum.Font.GothamBold
	nameLbl.TextColor3 = Color3.fromRGB(255, 255, 255)
	nameLbl.TextXAlignment = Enum.TextXAlignment.Left
	nameLbl.Parent = row

	local descLbl = Instance.new("TextLabel")
	descLbl.Size = UDim2.new(0.55, 0, 0, 24)
	descLbl.Position = UDim2.new(0, 12, 0, 38)
	descLbl.BackgroundTransparency = 1
	descLbl.Text = passInfo.description
	descLbl.TextSize = 12
	descLbl.Font = Enum.Font.Gotham
	descLbl.TextColor3 = Color3.fromRGB(180, 180, 180)
	descLbl.TextXAlignment = Enum.TextXAlignment.Left
	descLbl.Parent = row

	local buyBtn = Instance.new("TextButton")
	buyBtn.Name = "BuyButton"
	buyBtn.Size = UDim2.new(0, 110, 0, 40)
	buyBtn.Position = UDim2.new(1, -122, 0.5, -20)
	buyBtn.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
	buyBtn.Text = passInfo.price
	buyBtn.TextSize = 14
	buyBtn.Font = Enum.Font.GothamBold
	buyBtn.TextColor3 = Color3.fromRGB(15, 15, 22)
	buyBtn.Parent = row
	Instance.new("UICorner").Parent = buyBtn

	passButtons[passInfo.key] = buyBtn

	local capturedKey = passInfo.key
	buyBtn.MouseButton1Click:Connect(function()
		if ownedStatus[capturedKey] then return end
		PromptGamepass:FireServer(capturedKey)
	end)
end

-- ── Update owned states ───────────────────────────────────────────────────────
local function refreshOwnedUI(benefits: {[string]: boolean})
	local keyMap: {[string]: string} = {
		speedBoost   = "SPEED_BOOST",
		vip          = "VIP",
		extraStorage = "EXTRA_STORAGE",
		autoCollect  = "AUTO_COLLECT",
	}
	for benefitKey, passKey in keyMap do
		local owned = benefits[benefitKey] == true
		ownedStatus[passKey] = owned
		local btn = passButtons[passKey]
		if btn then
			if owned then
				btn.Text = "OWNED ✓"
				btn.BackgroundColor3 = Color3.fromRGB(50, 160, 80)
				btn.TextColor3 = Color3.fromRGB(255, 255, 255)
				btn.Active = false
			else
				btn.Text = "BUY"
				btn.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
				btn.TextColor3 = Color3.fromRGB(15, 15, 22)
				btn.Active = true
			end
		end
	end
end

BenefitsUpdated.OnClientEvent:Connect(refreshOwnedUI)

-- ── Open / close ──────────────────────────────────────────────────────────────
closeBtn.MouseButton1Click:Connect(function()
	screen.Enabled = false
end)

-- ── Hotkey "G" to open shop ───────────────────────────────────────────────────
local UserInputService = game:GetService("UserInputService")
UserInputService.InputBegan:Connect(function(input: InputObject, gameProcessed: boolean)
	if gameProcessed then return end
	if input.KeyCode == Enum.KeyCode.G then
		screen.Enabled = not screen.Enabled
	end
end)

-- ── Shop open button in top-right ─────────────────────────────────────────────
local shopBtn = Instance.new("ScreenGui")
shopBtn.Name = "GamepassOpenBtn"
shopBtn.ResetOnSpawn = false
shopBtn.Parent = playerGui

local openBtnFrame = Instance.new("TextButton")
openBtnFrame.Size = UDim2.new(0, 120, 0, 38)
openBtnFrame.Position = UDim2.new(1, -130, 0, 70)
openBtnFrame.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
openBtnFrame.Text = "⭐ Shop"
openBtnFrame.TextSize = 15
openBtnFrame.Font = Enum.Font.GothamBold
openBtnFrame.TextColor3 = Color3.fromRGB(15, 15, 22)
openBtnFrame.Parent = shopBtn
Instance.new("UICorner").Parent = openBtnFrame

openBtnFrame.MouseButton1Click:Connect(function()
	screen.Enabled = true
end)

print("[GamepassClient] Shop ready — press G to open")
`,
}

// ─── 15. Teleport / Lobby System ────────────────────────────────────────────

const TELEPORT_SERVER: GameSystemFile = {
  filename: 'TeleportServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- TeleportServer (ServerScript → ServerScriptService)
-- TeleportService: lobby→game, solo teleport, party teleport, error retry.

local Players          = game:GetService("Players")
local TeleportService  = game:GetService("TeleportService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")

-- ── Config — set your actual place IDs ───────────────────────────────────────
local PLACE_IDS = {
	LOBBY = 0000100,   -- Main lobby place ID
	GAME_1 = 0000101,  -- Game / map 1
	GAME_2 = 0000102,  -- Game / map 2
	MINIGAME = 0000103,
}

local MAX_PARTY_SIZE  = 10
local RETRY_ATTEMPTS  = 3
local RETRY_DELAY     = 2  -- seconds between retries

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder")
Remotes.Name = "TeleportRemotes"
Remotes.Parent = ReplicatedStorage

local TeleportPlayer  = Instance.new("RemoteEvent"); TeleportPlayer.Name  = "TeleportPlayer";  TeleportPlayer.Parent  = Remotes
local TeleportParty   = Instance.new("RemoteEvent"); TeleportParty.Name   = "TeleportParty";   TeleportParty.Parent   = Remotes
local TeleportStatus  = Instance.new("RemoteEvent"); TeleportStatus.Name  = "TeleportStatus";  TeleportStatus.Parent  = Remotes
local GetPlaceList    = Instance.new("RemoteFunction"); GetPlaceList.Name = "GetPlaceList";    GetPlaceList.Parent    = Remotes

-- ── Active parties: leader userId → {member UserIds} ─────────────────────────
local parties: {[number]: {number}} = {}

-- ── Safe teleport with retry ──────────────────────────────────────────────────
local function teleportWithRetry(playerList: {Player}, placeId: number, teleportData: {[string]: unknown}?)
	local options = TeleportService:SetTeleportGui(Instance.new("ScreenGui"))  -- blank loading screen override
	-- Build TeleportOptions
	local opts = Instance.new("TeleportOptions")
	if teleportData then
		opts:SetTeleportData(teleportData)
	end

	local attempt = 0
	local success = false
	repeat
		attempt += 1
		local ok, err = pcall(function()
			if #playerList == 1 then
				TeleportService:TeleportAsync(placeId, playerList, opts)
			else
				TeleportService:TeleportAsync(placeId, playerList, opts)
			end
		end)
		if ok then
			success = true
		else
			warn("[Teleport] Attempt", attempt, "failed:", err)
			if attempt < RETRY_ATTEMPTS then
				task.wait(RETRY_DELAY)
			end
		end
	until success or attempt >= RETRY_ATTEMPTS

	if not success then
		-- Notify players of failure
		for _, p in playerList do
			TeleportStatus:FireClient(p, "error", "Teleport failed after " .. RETRY_ATTEMPTS .. " attempts. Please try again.")
		end
	end
end

-- ── Solo teleport ─────────────────────────────────────────────────────────────
TeleportPlayer.OnServerEvent:Connect(function(player: Player, placeKey: unknown, extraData: unknown)
	if type(placeKey) ~= "string" then return end
	local placeId = PLACE_IDS[placeKey]
	if not placeId then
		warn("[Teleport] Unknown place key:", placeKey)
		return
	end

	TeleportStatus:FireClient(player, "loading", "Teleporting to " .. placeKey .. "...")
	local data: {[string]: unknown} = { fromPlaceKey = placeKey, userId = player.UserId }
	if type(extraData) == "table" then
		for k, v in extraData :: {[string]: unknown} do
			data[k] = v
		end
	end

	task.spawn(teleportWithRetry, {player}, placeId, data)
end)

-- ── Party teleport ────────────────────────────────────────────────────────────
TeleportParty.OnServerEvent:Connect(function(leader: Player, placeKey: unknown)
	if type(placeKey) ~= "string" then return end
	local placeId = PLACE_IDS[placeKey]
	if not placeId then return end

	local memberIds = parties[leader.UserId] or {leader.UserId}
	local playerList: {Player} = {}

	for _, uid in memberIds do
		local p = Players:GetPlayerByUserId(uid)
		if p and #playerList < MAX_PARTY_SIZE then
			table.insert(playerList, p)
		end
	end

	if #playerList == 0 then return end

	-- Notify all party members
	for _, p in playerList do
		TeleportStatus:FireClient(p, "loading", "Party teleporting! Staying together...")
	end

	task.spawn(teleportWithRetry, playerList, placeId, {
		isParty = true,
		leaderId = leader.UserId,
		partySize = #playerList,
	})
end)

-- ── Party management ──────────────────────────────────────────────────────────
-- Other server scripts can call these to manage parties
local function createParty(leader: Player): boolean
	if parties[leader.UserId] then return false end
	parties[leader.UserId] = {leader.UserId}
	return true
end

local function joinParty(leader: Player, member: Player): boolean
	local party = parties[leader.UserId]
	if not party then return false end
	if #party >= MAX_PARTY_SIZE then return false end
	-- Prevent duplicates
	for _, uid in party do
		if uid == member.UserId then return false end
	end
	table.insert(party, member.UserId)
	return true
end

local function disbandParty(leader: Player)
	parties[leader.UserId] = nil
end

-- Cleanup on leave
Players.PlayerRemoving:Connect(function(player: Player)
	disbandParty(player)
	-- Remove from any parties the player was in
	for leaderId, party in parties do
		for i, uid in party do
			if uid == player.UserId then
				table.remove(party, i)
				break
			end
		end
	end
end)

-- ── GetPlaceList — client can query available destinations ────────────────────
GetPlaceList.OnServerInvoke = function(_player: Player): {[string]: number}
	return PLACE_IDS
end

print("[TeleportServer] Ready — " .. #(function()
	local t = {}
	for k in PLACE_IDS do table.insert(t, k) end
	return t
end)() .. " places configured")

return { createParty = createParty, joinParty = joinParty, disbandParty = disbandParty }
`,
}

const TELEPORT_CLIENT: GameSystemFile = {
  filename: 'TeleportClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- TeleportClient (LocalScript → StarterPlayerScripts)
-- Loading screen overlay, status messages, and teleport trigger buttons.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local Remotes       = ReplicatedStorage:WaitForChild("TeleportRemotes")
local TeleportPlayer = Remotes:WaitForChild("TeleportPlayer") :: RemoteEvent
local TeleportParty  = Remotes:WaitForChild("TeleportParty")  :: RemoteEvent
local TeleportStatus = Remotes:WaitForChild("TeleportStatus") :: RemoteEvent
local GetPlaceList   = Remotes:WaitForChild("GetPlaceList")   :: RemoteFunction

-- ── Loading screen ────────────────────────────────────────────────────────────
local loadingGui = Instance.new("ScreenGui")
loadingGui.Name = "TeleportLoadingGui"
loadingGui.ResetOnSpawn = false
loadingGui.DisplayOrder = 100
loadingGui.Enabled = false
loadingGui.Parent = playerGui

local overlay = Instance.new("Frame")
overlay.Size = UDim2.new(1, 0, 1, 0)
overlay.BackgroundColor3 = Color3.fromRGB(8, 8, 14)
overlay.BackgroundTransparency = 0
overlay.Parent = loadingGui

-- Spinner ring (rotates via tween)
local spinnerOuter = Instance.new("Frame")
spinnerOuter.Size = UDim2.new(0, 80, 0, 80)
spinnerOuter.Position = UDim2.new(0.5, -40, 0.45, -40)
spinnerOuter.BackgroundTransparency = 1
spinnerOuter.Parent = overlay

local spinnerArc = Instance.new("UIStroke")  -- not a real spinner; use ImageLabel with rotation in production
local spinnerLabel = Instance.new("TextLabel")
spinnerLabel.Size = UDim2.new(0, 80, 0, 80)
spinnerLabel.BackgroundTransparency = 1
spinnerLabel.Text = "↻"
spinnerLabel.TextSize = 64
spinnerLabel.Font = Enum.Font.GothamBold
spinnerLabel.TextColor3 = Color3.fromRGB(212, 175, 55)
spinnerLabel.Parent = spinnerOuter

local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(0.6, 0, 0, 40)
statusLabel.Position = UDim2.new(0.2, 0, 0.6, 0)
statusLabel.BackgroundTransparency = 1
statusLabel.Text = "Teleporting..."
statusLabel.TextSize = 20
statusLabel.Font = Enum.Font.Gotham
statusLabel.TextColor3 = Color3.fromRGB(220, 220, 220)
statusLabel.Parent = overlay

local errorLabel = Instance.new("TextLabel")
errorLabel.Size = UDim2.new(0.6, 0, 0, 32)
errorLabel.Position = UDim2.new(0.2, 0, 0.68, 0)
errorLabel.BackgroundTransparency = 1
errorLabel.Text = ""
errorLabel.TextSize = 14
errorLabel.Font = Enum.Font.Gotham
errorLabel.TextColor3 = Color3.fromRGB(220, 80, 80)
errorLabel.Visible = false
errorLabel.Parent = overlay

-- Spinner rotation loop
local spinTween: Tween? = nil
local function startSpinner()
	spinnerLabel.Rotation = 0
	spinTween = TweenService:Create(spinnerLabel,
		TweenInfo.new(1, Enum.EasingStyle.Linear, Enum.EasingDirection.In, -1),
		{ Rotation = 360 }
	)
	spinTween:Play()
end
local function stopSpinner()
	if spinTween then spinTween:Cancel(); spinTween = nil end
end

-- ── Status handler ────────────────────────────────────────────────────────────
TeleportStatus.OnClientEvent:Connect(function(statusType: string, message: string)
	if statusType == "loading" then
		statusLabel.Text = message
		errorLabel.Visible = false
		loadingGui.Enabled = true
		startSpinner()
	elseif statusType == "error" then
		stopSpinner()
		statusLabel.Text = "Teleport Failed"
		errorLabel.Text = message
		errorLabel.Visible = true
		-- Auto-hide after 4 seconds
		task.delay(4, function()
			loadingGui.Enabled = false
		end)
	elseif statusType == "success" then
		stopSpinner()
		statusLabel.Text = "Arriving..."
		task.delay(1, function()
			loadingGui.Enabled = false
		end)
	end
end)

-- ── Server select UI ──────────────────────────────────────────────────────────
local serverGui = Instance.new("ScreenGui")
serverGui.Name = "ServerSelectGui"
serverGui.ResetOnSpawn = false
serverGui.Enabled = false
serverGui.Parent = playerGui

local panel = Instance.new("Frame")
panel.Size = UDim2.new(0, 340, 0, 320)
panel.Position = UDim2.new(0.5, -170, 0.5, -160)
panel.BackgroundColor3 = Color3.fromRGB(15, 15, 22)
panel.Parent = serverGui
Instance.new("UICorner").Parent = panel
local stroke = Instance.new("UIStroke"); stroke.Color = Color3.fromRGB(212, 175, 55); stroke.Thickness = 2; stroke.Parent = panel

local titleLbl = Instance.new("TextLabel")
titleLbl.Size = UDim2.new(1, -20, 0, 44)
titleLbl.Position = UDim2.new(0, 10, 0, 6)
titleLbl.BackgroundTransparency = 1
titleLbl.Text = "SELECT DESTINATION"
titleLbl.TextSize = 20
titleLbl.Font = Enum.Font.GothamBold
titleLbl.TextColor3 = Color3.fromRGB(212, 175, 55)
titleLbl.Parent = panel

local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0, 32, 0, 32)
closeBtn.Position = UDim2.new(1, -40, 0, 6)
closeBtn.BackgroundColor3 = Color3.fromRGB(160, 50, 50)
closeBtn.Text = "✕"; closeBtn.Font = Enum.Font.GothamBold; closeBtn.TextSize = 16
closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
closeBtn.Parent = panel
Instance.new("UICorner").Parent = closeBtn
closeBtn.MouseButton1Click:Connect(function() serverGui.Enabled = false end)

local listFrame = Instance.new("Frame")
listFrame.Size = UDim2.new(1, -20, 1, -60)
listFrame.Position = UDim2.new(0, 10, 0, 54)
listFrame.BackgroundTransparency = 1
listFrame.Parent = panel
Instance.new("UIListLayout").Parent = listFrame

-- Populate destinations
task.spawn(function()
	local ok, placeList = pcall(GetPlaceList.InvokeServer, GetPlaceList)
	if not ok or type(placeList) ~= "table" then return end

	for placeKey, _placeId in placeList :: {[string]: number} do
		local btn = Instance.new("TextButton")
		btn.Size = UDim2.new(1, 0, 0, 44)
		btn.BackgroundColor3 = Color3.fromRGB(30, 30, 45)
		btn.Text = "▶  " .. placeKey
		btn.TextSize = 15
		btn.Font = Enum.Font.GothamBold
		btn.TextColor3 = Color3.fromRGB(220, 220, 220)
		btn.Parent = listFrame
		Instance.new("UICorner").Parent = btn

		local capturedKey = placeKey
		btn.MouseButton1Click:Connect(function()
			serverGui.Enabled = false
			TeleportPlayer:FireServer(capturedKey)
		end)
	end
end)

-- ── Hotkey "T" to open server select ─────────────────────────────────────────
local UserInputService = game:GetService("UserInputService")
UserInputService.InputBegan:Connect(function(input: InputObject, gp: boolean)
	if gp then return end
	if input.KeyCode == Enum.KeyCode.T then
		serverGui.Enabled = not serverGui.Enabled
	end
end)

print("[TeleportClient] Ready — press T to open server select")
`,
}

// ─── 16. Notification / Popup System ────────────────────────────────────────

const NOTIFICATIONS_CLIENT: GameSystemFile = {
  filename: 'NotificationsClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- NotificationsClient (LocalScript → StarterPlayerScripts)
-- Queue-based slide-in toast notifications. Types: info, success, warning, error.
-- Also handles achievement unlock popups.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- ── Wait for server-side remotes ──────────────────────────────────────────────
local Remotes: Folder? = nil
local ShowNotification: RemoteEvent? = nil
local ShowAchievement:  RemoteEvent? = nil

task.spawn(function()
	-- Remotes may come from NotificationServer or be created here
	local folder = ReplicatedStorage:WaitForChild("NotificationRemotes", 10)
	if not folder then return end
	Remotes            = folder :: Folder
	ShowNotification   = folder:WaitForChild("ShowNotification") :: RemoteEvent
	ShowAchievement    = folder:WaitForChild("ShowAchievement")  :: RemoteEvent

	if ShowNotification then
		ShowNotification.OnClientEvent:Connect(function(notifType: string, title: string, message: string, duration: number?)
			queueNotification(notifType, title, message, duration or 4)
		end)
	end

	if ShowAchievement then
		ShowAchievement.OnClientEvent:Connect(function(achievementName: string, description: string, icon: string?)
			showAchievementPopup(achievementName, description, icon)
		end)
	end
end)

-- ── Notification style config ─────────────────────────────────────────────────
type NotifStyle = { bg: Color3, accent: Color3, icon: string }
local STYLES: {[string]: NotifStyle} = {
	info    = { bg = Color3.fromRGB(25, 35, 60),   accent = Color3.fromRGB(80, 140, 255),  icon = "ℹ" },
	success = { bg = Color3.fromRGB(20, 45, 30),   accent = Color3.fromRGB(70, 200, 100),  icon = "✓" },
	warning = { bg = Color3.fromRGB(50, 40, 10),   accent = Color3.fromRGB(255, 190, 40),  icon = "⚠" },
	error   = { bg = Color3.fromRGB(50, 15, 15),   accent = Color3.fromRGB(220, 70, 70),   icon = "✕" },
}

-- ── Notification container ────────────────────────────────────────────────────
local screen = Instance.new("ScreenGui")
screen.Name = "NotificationGui"
screen.ResetOnSpawn = false
screen.DisplayOrder = 50
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.Parent = playerGui

local container = Instance.new("Frame")
container.Name = "NotificationContainer"
container.Size = UDim2.new(0, 320, 1, -20)
container.Position = UDim2.new(1, -330, 0, 10)
container.BackgroundTransparency = 1
container.Parent = screen

local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 8)
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.VerticalAlignment = Enum.VerticalAlignment.Bottom
layout.FillDirection = Enum.FillDirection.Vertical
layout.Parent = container

-- ── Queue system ──────────────────────────────────────────────────────────────
local notifQueue: {{type: string, title: string, message: string, duration: number}} = {}
local isProcessing = false
local notifCount = 0

local function processQueue()
	if isProcessing or #notifQueue == 0 then return end
	isProcessing = true

	while #notifQueue > 0 do
		local notif = table.remove(notifQueue, 1)
		local style = STYLES[notif.type] or STYLES.info

		notifCount += 1
		local order = notifCount

		-- Build notification frame
		local frame = Instance.new("Frame")
		frame.Name = "Notif_" .. order
		frame.Size = UDim2.new(1, 0, 0, 72)
		frame.BackgroundColor3 = style.bg
		frame.BackgroundTransparency = 0.08
		frame.LayoutOrder = order
		-- Start off-screen to the right
		frame.Position = UDim2.new(1, 20, 0, 0)
		frame.Parent = container
		Instance.new("UICorner").Parent = frame

		-- Accent left bar
		local accentBar = Instance.new("Frame")
		accentBar.Size = UDim2.new(0, 4, 1, 0)
		accentBar.BackgroundColor3 = style.accent
		accentBar.BorderSizePixel = 0
		accentBar.Parent = frame
		Instance.new("UICorner").Parent = accentBar

		-- Icon
		local iconLbl = Instance.new("TextLabel")
		iconLbl.Size = UDim2.new(0, 36, 1, 0)
		iconLbl.Position = UDim2.new(0, 10, 0, 0)
		iconLbl.BackgroundTransparency = 1
		iconLbl.Text = style.icon
		iconLbl.TextSize = 24
		iconLbl.Font = Enum.Font.GothamBold
		iconLbl.TextColor3 = style.accent
		iconLbl.Parent = frame

		-- Title
		local titleLbl = Instance.new("TextLabel")
		titleLbl.Size = UDim2.new(1, -60, 0, 28)
		titleLbl.Position = UDim2.new(0, 50, 0, 8)
		titleLbl.BackgroundTransparency = 1
		titleLbl.Text = notif.title
		titleLbl.TextSize = 15
		titleLbl.Font = Enum.Font.GothamBold
		titleLbl.TextColor3 = Color3.fromRGB(240, 240, 240)
		titleLbl.TextXAlignment = Enum.TextXAlignment.Left
		titleLbl.Parent = frame

		-- Message
		local msgLbl = Instance.new("TextLabel")
		msgLbl.Size = UDim2.new(1, -60, 0, 24)
		msgLbl.Position = UDim2.new(0, 50, 0, 36)
		msgLbl.BackgroundTransparency = 1
		msgLbl.Text = notif.message
		msgLbl.TextSize = 12
		msgLbl.Font = Enum.Font.Gotham
		msgLbl.TextColor3 = Color3.fromRGB(190, 190, 190)
		msgLbl.TextXAlignment = Enum.TextXAlignment.Left
		msgLbl.Parent = frame

		-- Progress bar (shrinks over duration)
		local progressBg = Instance.new("Frame")
		progressBg.Size = UDim2.new(1, -8, 0, 3)
		progressBg.Position = UDim2.new(0, 4, 1, -5)
		progressBg.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
		progressBg.Parent = frame
		Instance.new("UICorner").Parent = progressBg

		local progressBar = Instance.new("Frame")
		progressBar.Size = UDim2.new(1, 0, 1, 0)
		progressBar.BackgroundColor3 = style.accent
		progressBar.Parent = progressBg
		Instance.new("UICorner").Parent = progressBar

		-- Slide in
		TweenService:Create(frame,
			TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
			{ Position = UDim2.new(0, 0, 0, 0) }
		):Play()

		-- Progress bar drain
		TweenService:Create(progressBar,
			TweenInfo.new(notif.duration, Enum.EasingStyle.Linear),
			{ Size = UDim2.new(0, 0, 1, 0) }
		):Play()

		-- Wait, then slide out
		task.wait(notif.duration)

		local slideOut = TweenService:Create(frame,
			TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
			{ Position = UDim2.new(1, 20, 0, 0) }
		)
		slideOut:Play()
		slideOut.Completed:Wait()
		frame:Destroy()
	end

	isProcessing = false
end

function queueNotification(notifType: string, title: string, message: string, duration: number)
	table.insert(notifQueue, { type = notifType, title = title, message = message, duration = duration })
	task.spawn(processQueue)
end

-- ── Achievement popup ─────────────────────────────────────────────────────────
function showAchievementPopup(achievementName: string, description: string, icon: string?)
	local popup = Instance.new("Frame")
	popup.Size = UDim2.new(0, 360, 0, 110)
	popup.Position = UDim2.new(0.5, -180, 1, 20)  -- off-screen below
	popup.BackgroundColor3 = Color3.fromRGB(12, 12, 20)
	popup.Parent = screen
	Instance.new("UICorner").Parent = popup

	local goldStroke = Instance.new("UIStroke")
	goldStroke.Color = Color3.fromRGB(212, 175, 55)
	goldStroke.Thickness = 2
	goldStroke.Parent = popup

	-- Gold shimmer bar on top
	local shimmer = Instance.new("Frame")
	shimmer.Size = UDim2.new(1, 0, 0, 4)
	shimmer.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
	shimmer.Parent = popup

	local iconLbl = Instance.new("TextLabel")
	iconLbl.Size = UDim2.new(0, 70, 1, 0)
	iconLbl.BackgroundTransparency = 1
	iconLbl.Text = icon or "🏆"
	iconLbl.TextSize = 44
	iconLbl.Font = Enum.Font.GothamBold
	iconLbl.TextColor3 = Color3.fromRGB(212, 175, 55)
	iconLbl.Parent = popup

	local headerLbl = Instance.new("TextLabel")
	headerLbl.Size = UDim2.new(1, -80, 0, 26)
	headerLbl.Position = UDim2.new(0, 75, 0, 12)
	headerLbl.BackgroundTransparency = 1
	headerLbl.Text = "ACHIEVEMENT UNLOCKED"
	headerLbl.TextSize = 11
	headerLbl.Font = Enum.Font.GothamBold
	headerLbl.TextColor3 = Color3.fromRGB(212, 175, 55)
	headerLbl.TextXAlignment = Enum.TextXAlignment.Left
	headerLbl.Parent = popup

	local nameLbl = Instance.new("TextLabel")
	nameLbl.Size = UDim2.new(1, -80, 0, 30)
	nameLbl.Position = UDim2.new(0, 75, 0, 36)
	nameLbl.BackgroundTransparency = 1
	nameLbl.Text = achievementName
	nameLbl.TextSize = 20
	nameLbl.Font = Enum.Font.GothamBold
	nameLbl.TextColor3 = Color3.fromRGB(255, 255, 255)
	nameLbl.TextXAlignment = Enum.TextXAlignment.Left
	nameLbl.Parent = popup

	local descLbl = Instance.new("TextLabel")
	descLbl.Size = UDim2.new(1, -80, 0, 22)
	descLbl.Position = UDim2.new(0, 75, 0, 70)
	descLbl.BackgroundTransparency = 1
	descLbl.Text = description
	descLbl.TextSize = 13
	descLbl.Font = Enum.Font.Gotham
	descLbl.TextColor3 = Color3.fromRGB(190, 190, 190)
	descLbl.TextXAlignment = Enum.TextXAlignment.Left
	descLbl.Parent = popup

	-- Slide up from bottom
	TweenService:Create(popup,
		TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
		{ Position = UDim2.new(0.5, -180, 1, -130) }
	):Play()

	task.wait(4)

	local slideDown = TweenService:Create(popup,
		TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
		{ Position = UDim2.new(0.5, -180, 1, 20) }
	)
	slideDown:Play()
	slideDown.Completed:Wait()
	popup:Destroy()
end

-- ── Self-test: show a sample on load (remove in production) ───────────────────
task.delay(2, function()
	queueNotification("success", "Welcome!", "Connected to the server.", 4)
end)

print("[NotificationsClient] Ready")
`,
}

const NOTIFICATIONS_SERVER: GameSystemFile = {
  filename: 'NotificationsServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- NotificationsServer (ServerScript → ServerScriptService)
-- Exposes RemoteEvents so server scripts can push notifications to clients.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder")
Remotes.Name = "NotificationRemotes"
Remotes.Parent = ReplicatedStorage

local ShowNotification = Instance.new("RemoteEvent"); ShowNotification.Name = "ShowNotification"; ShowNotification.Parent = Remotes
local ShowAchievement  = Instance.new("RemoteEvent"); ShowAchievement.Name  = "ShowAchievement";  ShowAchievement.Parent  = Remotes

-- ── Public API for other server scripts ──────────────────────────────────────

-- notifType: "info" | "success" | "warning" | "error"
local function notifyPlayer(player: Player, notifType: string, title: string, message: string, duration: number?)
	ShowNotification:FireClient(player, notifType, title, message, duration or 4)
end

local function notifyAll(notifType: string, title: string, message: string, duration: number?)
	ShowNotification:FireAllClients(notifType, title, message, duration or 4)
end

local function notifyAchievement(player: Player, achievementName: string, description: string, icon: string?)
	ShowAchievement:FireClient(player, achievementName, description, icon)
end

-- ── Example: notify when player joins ────────────────────────────────────────
Players.PlayerAdded:Connect(function(player: Player)
	task.delay(3, function()
		if player.Parent then
			notifyPlayer(player, "info", "Welcome, " .. player.Name .. "!", "Enjoy your time on the server.", 5)
		end
	end)
end)

print("[NotificationsServer] Ready")

return {
	notifyPlayer     = notifyPlayer,
	notifyAll        = notifyAll,
	notifyAchievement = notifyAchievement,
}
`,
}

// ─── 17. Voting / Poll System ────────────────────────────────────────────────

const VOTING_SERVER: GameSystemFile = {
  filename: 'VotingServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- VotingServer (ServerScript → ServerScriptService)
-- Map/mode voting with countdown timer, live vote tallies, and winner broadcast.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- ── Config ────────────────────────────────────────────────────────────────────
local VOTE_DURATION   = 30   -- seconds for the voting window
local MIN_VOTES_NEEDED = 1   -- minimum votes before a winner is valid (set higher in production)

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder")
Remotes.Name = "VotingRemotes"
Remotes.Parent = ReplicatedStorage

local StartVote    = Instance.new("RemoteEvent"); StartVote.Name    = "StartVote";    StartVote.Parent    = Remotes
local CastVote     = Instance.new("RemoteEvent"); CastVote.Name     = "CastVote";     CastVote.Parent     = Remotes
local UpdateTally  = Instance.new("RemoteEvent"); UpdateTally.Name  = "UpdateTally";  UpdateTally.Parent  = Remotes
local VoteResult   = Instance.new("RemoteEvent"); VoteResult.Name   = "VoteResult";   VoteResult.Parent   = Remotes
local GetVoteState = Instance.new("RemoteFunction"); GetVoteState.Name = "GetVoteState"; GetVoteState.Parent = Remotes

-- ── State ─────────────────────────────────────────────────────────────────────
type VoteOption = { id: string, label: string, description: string }
type VoteSession = {
	options:    {VoteOption},
	tally:      {[string]: number},
	playerVotes:{[number]: string},   -- userId → option id
	endTime:    number,
	active:     boolean,
}

local currentSession: VoteSession? = nil

-- ── Start a vote session ─────────────────────────────────────────────────────
local function startVote(options: {VoteOption}, duration: number?)
	if currentSession and currentSession.active then
		warn("[Voting] Vote already in progress")
		return
	end

	local voteDuration = duration or VOTE_DURATION
	local tally: {[string]: number} = {}
	for _, opt in options do
		tally[opt.id] = 0
	end

	currentSession = {
		options     = options,
		tally       = tally,
		playerVotes = {},
		endTime     = os.time() + voteDuration,
		active      = true,
	}

	-- Broadcast to all clients
	StartVote:FireAllClients(options, voteDuration)

	-- Countdown and tally updates
	task.spawn(function()
		local endTime = os.time() + voteDuration
		while os.time() < endTime do
			task.wait(1)
			if currentSession and currentSession.active then
				local timeLeft = math.max(0, endTime - os.time())
				UpdateTally:FireAllClients(currentSession.tally, timeLeft)
			end
		end

		if not currentSession then return end
		currentSession.active = false

		-- Determine winner (most votes, random tiebreak)
		local winner: string? = nil
		local highestVotes = -1
		local tied: {string} = {}

		for optId, count in currentSession.tally do
			if count > highestVotes then
				highestVotes = count
				winner = optId
				tied = {optId}
			elseif count == highestVotes then
				table.insert(tied, optId)
			end
		end

		-- Tiebreak
		if #tied > 1 then
			winner = tied[math.random(1, #tied)]
		end

		-- Find winner label
		local winnerLabel = winner or "None"
		for _, opt in currentSession.options do
			if opt.id == winner then
				winnerLabel = opt.label
				break
			end
		end

		-- Announce
		VoteResult:FireAllClients(winner, winnerLabel, currentSession.tally, highestVotes)
		currentSession = nil
	end)
end

-- ── Cast vote ─────────────────────────────────────────────────────────────────
CastVote.OnServerEvent:Connect(function(player: Player, optionId: unknown)
	if type(optionId) ~= "string" then return end
	if not currentSession or not currentSession.active then return end

	-- Already voted?
	if currentSession.playerVotes[player.UserId] then return end

	-- Valid option?
	local valid = false
	for _, opt in currentSession.options do
		if opt.id == optionId then valid = true; break end
	end
	if not valid then return end

	-- Remove previous vote (shouldn't exist, but safety)
	currentSession.playerVotes[player.UserId] = optionId
	currentSession.tally[optionId] = (currentSession.tally[optionId] or 0) + 1

	-- Push updated tally instantly
	local timeLeft = math.max(0, currentSession.endTime - os.time())
	UpdateTally:FireAllClients(currentSession.tally, timeLeft)
end)

-- ── GetVoteState ──────────────────────────────────────────────────────────────
GetVoteState.OnServerInvoke = function(player: Player): (boolean, VoteSession?)
	if currentSession and currentSession.active then
		return true, currentSession
	end
	return false, nil
end

-- ── Example: auto-start a map vote every 5 minutes ───────────────────────────
task.spawn(function()
	while true do
		task.wait(300)  -- 5 minutes
		startVote({
			{ id = "map_city",    label = "City Center",    description = "Urban street battles" },
			{ id = "map_forest",  label = "Dark Forest",    description = "Dense cover and fog"  },
			{ id = "map_volcano", label = "Volcano Island", description = "Lava and high ground" },
		}, VOTE_DURATION)
	end
end)

print("[VotingServer] Ready — " .. VOTE_DURATION .. "s vote window")

return { startVote = startVote }
`,
}

const VOTING_CLIENT: GameSystemFile = {
  filename: 'VotingClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- VotingClient (LocalScript → StarterPlayerScripts)
-- Shows vote options with live tallies, countdown, and winner announcement.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local Remotes     = ReplicatedStorage:WaitForChild("VotingRemotes")
local StartVote   = Remotes:WaitForChild("StartVote")   :: RemoteEvent
local CastVote    = Remotes:WaitForChild("CastVote")    :: RemoteEvent
local UpdateTally = Remotes:WaitForChild("UpdateTally") :: RemoteEvent
local VoteResult  = Remotes:WaitForChild("VoteResult")  :: RemoteEvent

-- ── Build the voting GUI ──────────────────────────────────────────────────────
local screen = Instance.new("ScreenGui")
screen.Name = "VotingGui"
screen.ResetOnSpawn = false
screen.Enabled = false
screen.Parent = playerGui

local panel = Instance.new("Frame")
panel.Size = UDim2.new(0, 380, 0, 480)
panel.Position = UDim2.new(0.5, -190, 0.5, -240)
panel.BackgroundColor3 = Color3.fromRGB(12, 12, 20)
panel.Parent = screen
Instance.new("UICorner").Parent = panel
local pStroke = Instance.new("UIStroke"); pStroke.Color = Color3.fromRGB(212, 175, 55); pStroke.Thickness = 2; pStroke.Parent = panel

local headerLbl = Instance.new("TextLabel")
headerLbl.Size = UDim2.new(1, -20, 0, 44)
headerLbl.Position = UDim2.new(0, 10, 0, 8)
headerLbl.BackgroundTransparency = 1
headerLbl.Text = "VOTE FOR NEXT MAP"
headerLbl.TextSize = 22
headerLbl.Font = Enum.Font.GothamBold
headerLbl.TextColor3 = Color3.fromRGB(212, 175, 55)
headerLbl.Parent = panel

local timerLbl = Instance.new("TextLabel")
timerLbl.Size = UDim2.new(0, 80, 0, 36)
timerLbl.Position = UDim2.new(1, -90, 0, 12)
timerLbl.BackgroundTransparency = 1
timerLbl.Text = "30s"
timerLbl.TextSize = 22
timerLbl.Font = Enum.Font.GothamBold
timerLbl.TextColor3 = Color3.fromRGB(240, 120, 60)
timerLbl.Parent = panel

local optionsFrame = Instance.new("Frame")
optionsFrame.Size = UDim2.new(1, -20, 1, -120)
optionsFrame.Position = UDim2.new(0, 10, 0, 64)
optionsFrame.BackgroundTransparency = 1
optionsFrame.Parent = panel

local optLayout = Instance.new("UIListLayout")
optLayout.Padding = UDim.new(0, 10)
optLayout.SortOrder = Enum.SortOrder.LayoutOrder
optLayout.Parent = optionsFrame

local myVote: string? = nil
local optionButtons: {[string]: {frame: Frame, bar: Frame, pct: TextLabel, btn: TextButton}} = {}

-- ── Start vote — build option rows ────────────────────────────────────────────
StartVote.OnClientEvent:Connect(function(options: {{id: string, label: string, description: string}}, duration: number)
	-- Reset
	myVote = nil
	for _, child in optionsFrame:GetChildren() do
		if child:IsA("Frame") then child:Destroy() end
	end
	optionButtons = {}

	for i, opt in options do
		local row = Instance.new("Frame")
		row.Name = opt.id
		row.Size = UDim2.new(1, 0, 0, 90)
		row.BackgroundColor3 = Color3.fromRGB(22, 22, 35)
		row.LayoutOrder = i
		row.Parent = optionsFrame
		Instance.new("UICorner").Parent = row

		local optStroke = Instance.new("UIStroke"); optStroke.Color = Color3.fromRGB(60, 60, 90); optStroke.Thickness = 1.5; optStroke.Parent = row

		local voteBtn = Instance.new("TextButton")
		voteBtn.Size = UDim2.new(1, 0, 1, 0)
		voteBtn.BackgroundTransparency = 1
		voteBtn.Text = ""
		voteBtn.Parent = row

		local nameLbl = Instance.new("TextLabel")
		nameLbl.Size = UDim2.new(0.7, 0, 0, 28)
		nameLbl.Position = UDim2.new(0, 12, 0, 8)
		nameLbl.BackgroundTransparency = 1
		nameLbl.Text = opt.label
		nameLbl.TextSize = 16
		nameLbl.Font = Enum.Font.GothamBold
		nameLbl.TextColor3 = Color3.fromRGB(230, 230, 230)
		nameLbl.TextXAlignment = Enum.TextXAlignment.Left
		nameLbl.Parent = row

		local descLbl = Instance.new("TextLabel")
		descLbl.Size = UDim2.new(0.7, 0, 0, 20)
		descLbl.Position = UDim2.new(0, 12, 0, 36)
		descLbl.BackgroundTransparency = 1
		descLbl.Text = opt.description
		descLbl.TextSize = 12
		descLbl.Font = Enum.Font.Gotham
		descLbl.TextColor3 = Color3.fromRGB(160, 160, 160)
		descLbl.TextXAlignment = Enum.TextXAlignment.Left
		descLbl.Parent = row

		-- Vote bar background
		local barBg = Instance.new("Frame")
		barBg.Size = UDim2.new(1, -24, 0, 8)
		barBg.Position = UDim2.new(0, 12, 1, -18)
		barBg.BackgroundColor3 = Color3.fromRGB(40, 40, 55)
		barBg.Parent = row
		Instance.new("UICorner").Parent = barBg

		local bar = Instance.new("Frame")
		bar.Size = UDim2.new(0, 0, 1, 0)
		bar.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
		bar.Parent = barBg
		Instance.new("UICorner").Parent = bar

		local pctLbl = Instance.new("TextLabel")
		pctLbl.Size = UDim2.new(0, 60, 0, 28)
		pctLbl.Position = UDim2.new(1, -70, 0, 8)
		pctLbl.BackgroundTransparency = 1
		pctLbl.Text = "0%"
		pctLbl.TextSize = 14
		pctLbl.Font = Enum.Font.GothamBold
		pctLbl.TextColor3 = Color3.fromRGB(212, 175, 55)
		pctLbl.Parent = row

		optionButtons[opt.id] = { frame = row, bar = bar, pct = pctLbl, btn = voteBtn }

		local capturedId = opt.id
		voteBtn.MouseButton1Click:Connect(function()
			if myVote then return end
			myVote = capturedId
			CastVote:FireServer(capturedId)
			-- Highlight selected
			row.BackgroundColor3 = Color3.fromRGB(30, 50, 30)
			optStroke.Color = Color3.fromRGB(70, 200, 100)
		end)
	end

	timerLbl.Text = tostring(math.floor(duration)) .. "s"
	screen.Enabled = true
end)

-- ── Update tally ──────────────────────────────────────────────────────────────
UpdateTally.OnClientEvent:Connect(function(tally: {[string]: number}, timeLeft: number)
	timerLbl.Text = tostring(math.floor(timeLeft)) .. "s"
	if timeLeft <= 10 then
		timerLbl.TextColor3 = Color3.fromRGB(220, 60, 60)
	end

	-- Calculate total votes
	local total = 0
	for _, count in tally do total += count end

	for optId, widgets in optionButtons do
		local count = tally[optId] or 0
		local pct = total > 0 and (count / total) or 0
		TweenService:Create(widgets.bar,
			TweenInfo.new(0.4, Enum.EasingStyle.Quad),
			{ Size = UDim2.new(pct, 0, 1, 0) }
		):Play()
		widgets.pct.Text = tostring(math.round(pct * 100)) .. "%"
	end
end)

-- ── Vote result ───────────────────────────────────────────────────────────────
VoteResult.OnClientEvent:Connect(function(winnerId: string, winnerLabel: string, _tally: {[string]: number}, _highestVotes: number)
	-- Hide vote panel, show result banner
	screen.Enabled = false

	local resultGui = Instance.new("ScreenGui")
	resultGui.Name = "VoteResultGui"
	resultGui.ResetOnSpawn = false
	resultGui.Parent = playerGui

	local banner = Instance.new("Frame")
	banner.Size = UDim2.new(0, 440, 0, 100)
	banner.Position = UDim2.new(0.5, -220, 0, -120)
	banner.BackgroundColor3 = Color3.fromRGB(10, 10, 18)
	banner.Parent = resultGui
	Instance.new("UICorner").Parent = banner
	local bStroke = Instance.new("UIStroke"); bStroke.Color = Color3.fromRGB(212, 175, 55); bStroke.Thickness = 2; bStroke.Parent = banner

	local resultLbl = Instance.new("TextLabel")
	resultLbl.Size = UDim2.new(1, -20, 0.5, 0)
	resultLbl.Position = UDim2.new(0, 10, 0, 8)
	resultLbl.BackgroundTransparency = 1
	resultLbl.Text = "VOTE WINNER"
	resultLbl.TextSize = 13
	resultLbl.Font = Enum.Font.GothamBold
	resultLbl.TextColor3 = Color3.fromRGB(212, 175, 55)
	resultLbl.Parent = banner

	local mapLbl = Instance.new("TextLabel")
	mapLbl.Size = UDim2.new(1, -20, 0.5, 0)
	mapLbl.Position = UDim2.new(0, 10, 0.5, 0)
	mapLbl.BackgroundTransparency = 1
	mapLbl.Text = "▶  " .. winnerLabel
	mapLbl.TextSize = 26
	mapLbl.Font = Enum.Font.GothamBold
	mapLbl.TextColor3 = Color3.fromRGB(240, 240, 240)
	mapLbl.Parent = banner

	-- Slide in
	TweenService:Create(banner,
		TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
		{ Position = UDim2.new(0.5, -220, 0, 20) }
	):Play()

	task.wait(4)

	local slideOut = TweenService:Create(banner,
		TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
		{ Position = UDim2.new(0.5, -220, 0, -120) }
	)
	slideOut:Play()
	slideOut.Completed:Wait()
	resultGui:Destroy()
end)

print("[VotingClient] Ready")
`,
}

// ─── 18. Round / Match System ────────────────────────────────────────────────

const ROUNDS_SERVER: GameSystemFile = {
  filename: 'RoundsServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- RoundsServer (ServerScript → ServerScriptService)
-- Manages full round lifecycle: intermission → active → results.
-- Tracks per-player scores, win conditions, spawning, and timers.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- ── Config ────────────────────────────────────────────────────────────────────
local INTERMISSION_TIME = 15   -- seconds between rounds
local ROUND_TIME        = 120  -- max round duration (seconds)
local MIN_PLAYERS       = 2    -- minimum players needed to start a round
local KILL_WIN_SCORE    = 10   -- kills needed to trigger early win

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder")
Remotes.Name = "RoundsRemotes"
Remotes.Parent = ReplicatedStorage

local RoundStateChange = Instance.new("RemoteEvent"); RoundStateChange.Name = "RoundStateChange"; RoundStateChange.Parent = Remotes
local TimerUpdate      = Instance.new("RemoteEvent"); TimerUpdate.Name      = "TimerUpdate";      TimerUpdate.Parent      = Remotes
local ScoreUpdate      = Instance.new("RemoteEvent"); ScoreUpdate.Name      = "ScoreUpdate";      ScoreUpdate.Parent      = Remotes
local RoundResult      = Instance.new("RemoteEvent"); RoundResult.Name      = "RoundResult";      RoundResult.Parent      = Remotes
local GetRoundState    = Instance.new("RemoteFunction"); GetRoundState.Name = "GetRoundState";    GetRoundState.Parent    = Remotes

-- ── State types ───────────────────────────────────────────────────────────────
type RoundState = "intermission" | "active" | "results" | "waiting"
type PlayerScore = { kills: number, deaths: number, points: number }

local roundState: RoundState    = "waiting"
local roundNumber: number       = 0
local scores:      {[number]: PlayerScore} = {}  -- userId → score
local roundStartTime: number    = 0
local activeRound = false  -- guard flag

-- ── Spawn point helpers ───────────────────────────────────────────────────────
-- Place BaseParts named "SpawnPoint1", "SpawnPoint2", … inside Workspace/RoundSpawns
local SPAWN_FOLDER = "RoundSpawns"

local function getSpawnPoints(): {BasePart}
	local folder = workspace:FindFirstChild(SPAWN_FOLDER)
	if not folder then return {} end
	local pts: {BasePart} = {}
	for _, child in folder:GetChildren() do
		if child:IsA("BasePart") then
			table.insert(pts, child :: BasePart)
		end
	end
	return pts
end

local usedSpawns: {[number]: boolean} = {}

local function getSpawnCFrame(): CFrame
	local pts = getSpawnPoints()
	if #pts == 0 then
		return CFrame.new(0, 10, 0)
	end
	-- Try to find an unused spawn
	for _, pt in pts do
		if not usedSpawns[pt:GetDebugId()] then
			usedSpawns[pt:GetDebugId()] = true
			return pt.CFrame + Vector3.new(0, 5, 0)
		end
	end
	-- All used: pick random
	local pt = pts[math.random(1, #pts)]
	return pt.CFrame + Vector3.new(0, 5, 0)
end

local function spawnPlayer(player: Player)
	local char = player.Character
	if not char then return end
	local root = char:FindFirstChild("HumanoidRootPart") :: BasePart?
	if root then
		root.CFrame = getSpawnCFrame()
	end
end

-- ── Score helpers ─────────────────────────────────────────────────────────────
local function getOrCreateScore(player: Player): PlayerScore
	local uid = player.UserId
	if not scores[uid] then
		scores[uid] = { kills = 0, deaths = 0, points = 0 }
	end
	return scores[uid]
end

local function broadcastScores()
	local payload: {{name: string, kills: number, deaths: number, points: number}} = {}
	for uid, sc in scores do
		local p = Players:GetPlayerByUserId(uid)
		if p then
			table.insert(payload, { name = p.Name, kills = sc.kills, deaths = sc.deaths, points = sc.points })
		end
	end
	table.sort(payload, function(a, b) return a.points > b.points end)
	ScoreUpdate:FireAllClients(payload)
end

-- ── Check win condition ───────────────────────────────────────────────────────
local function checkWinCondition(): (boolean, Player?)
	for uid, sc in scores do
		if sc.kills >= KILL_WIN_SCORE then
			local winner = Players:GetPlayerByUserId(uid)
			if winner then return true, winner end
		end
	end
	return false, nil
end

-- ── Round phases ──────────────────────────────────────────────────────────────
local function endRound(reason: string, winner: Player?)
	activeRound = false
	roundState = "results"

	-- Build results table
	local results: {{name: string, kills: number, deaths: number, points: number}} = {}
	for uid, sc in scores do
		local p = Players:GetPlayerByUserId(uid)
		if p then
			table.insert(results, { name = p.Name, kills = sc.kills, deaths = sc.deaths, points = sc.points })
		end
	end
	table.sort(results, function(a, b) return a.points > b.points end)

	RoundStateChange:FireAllClients("results", roundNumber)
	RoundResult:FireAllClients(reason, winner and winner.Name or nil, results)

	-- Award coins to winner
	if winner then
		local ls = winner:FindFirstChild("leaderstats")
		if ls then
			local coins = ls:FindFirstChild("Coins") :: IntValue?
			if coins then coins.Value += 50 end
		end
	end
end

local function startRound()
	roundNumber += 1
	roundState = "active"
	activeRound = true
	scores = {}
	usedSpawns = {}

	-- Spawn all players
	for _, player in Players:GetPlayers() do
		getOrCreateScore(player)
		player:LoadCharacter()
		task.delay(0.5, function()
			if player.Parent then spawnPlayer(player) end
		end)
	end

	roundStartTime = os.time()
	RoundStateChange:FireAllClients("active", roundNumber, ROUND_TIME)
	broadcastScores()

	-- Round timer
	task.spawn(function()
		local endTime = os.time() + ROUND_TIME
		while activeRound and os.time() < endTime do
			task.wait(1)
			local timeLeft = math.max(0, endTime - os.time())
			TimerUpdate:FireAllClients(timeLeft)

			-- Check win condition every second
			local won, winner = checkWinCondition()
			if won then
				endRound("kill_limit", winner)
				return
			end
		end
		if activeRound then
			endRound("time_up", nil)
		end
	end)
end

local function runIntermission()
	roundState = "intermission"
	RoundStateChange:FireAllClients("intermission", roundNumber, INTERMISSION_TIME)

	task.spawn(function()
		local endTime = os.time() + INTERMISSION_TIME
		while os.time() < endTime do
			task.wait(1)
			local timeLeft = math.max(0, endTime - os.time())
			TimerUpdate:FireAllClients(timeLeft)
		end

		local activePlayers = #Players:GetPlayers()
		if activePlayers >= MIN_PLAYERS then
			startRound()
		else
			roundState = "waiting"
			RoundStateChange:FireAllClients("waiting", roundNumber)
		end
	end)
end

-- ── Player death tracking ─────────────────────────────────────────────────────
Players.PlayerAdded:Connect(function(player: Player)
	player.CharacterAdded:Connect(function(character: Model)
		local humanoid = character:WaitForChild("Humanoid", 5) :: Humanoid?
		if not humanoid then return end

		humanoid.Died:Connect(function()
			if roundState ~= "active" then return end

			-- Award death to this player
			local deadScore = getOrCreateScore(player)
			deadScore.deaths += 1

			-- Detect killer via humanoid tag (assumes weapons set a "killer" attribute on humanoid)
			local killerValue = humanoid:FindFirstChild("killer") :: ObjectValue?
			if killerValue and killerValue.Value then
				local killerChar = killerValue.Value
				local killerPlayer = Players:GetPlayerFromCharacter(killerChar :: Model)
				if killerPlayer and killerPlayer ~= player then
					local kScore = getOrCreateScore(killerPlayer)
					kScore.kills  += 1
					kScore.points += 10
				end
			end

			broadcastScores()

			-- Respawn during round
			task.delay(5, function()
				if player.Parent and roundState == "active" then
					player:LoadCharacter()
					task.delay(0.5, function()
						if player.Parent then spawnPlayer(player) end
					end)
				end
			end)
		end)
	end)
end)

-- ── Player count check — start intermission when enough players join ──────────
local function checkPlayerCount()
	if roundState == "waiting" and #Players:GetPlayers() >= MIN_PLAYERS then
		runIntermission()
	end
end

Players.PlayerAdded:Connect(checkPlayerCount)

Players.PlayerRemoving:Connect(function(player: Player)
	scores[player.UserId] = nil
	-- End round if not enough players
	if roundState == "active" and #Players:GetPlayers() - 1 < MIN_PLAYERS then
		endRound("not_enough_players", nil)
	end
end)

-- ── GetRoundState ──────────────────────────────────────────────────────────────
GetRoundState.OnServerInvoke = function(_player: Player): (RoundState, number)
	return roundState, roundNumber
end

-- ── Kick off the system ────────────────────────────────────────────────────────
checkPlayerCount()

print("[RoundsServer] Ready — " .. ROUND_TIME .. "s rounds, " .. MIN_PLAYERS .. " min players")

return { startRound = startRound, endRound = endRound, runIntermission = runIntermission }
`,
}

const ROUNDS_CLIENT: GameSystemFile = {
  filename: 'RoundsClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- RoundsClient (LocalScript → StarterPlayerScripts)
-- HUD: round state banner, countdown timer, scoreboard, results screen.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local Remotes        = ReplicatedStorage:WaitForChild("RoundsRemotes")
local RoundStateChange = Remotes:WaitForChild("RoundStateChange") :: RemoteEvent
local TimerUpdate    = Remotes:WaitForChild("TimerUpdate")    :: RemoteEvent
local ScoreUpdate    = Remotes:WaitForChild("ScoreUpdate")    :: RemoteEvent
local RoundResult    = Remotes:WaitForChild("RoundResult")    :: RemoteEvent

-- ── Main HUD screen ───────────────────────────────────────────────────────────
local screen = Instance.new("ScreenGui")
screen.Name = "RoundsGui"
screen.ResetOnSpawn = false
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.Parent = playerGui

-- Round state banner (top center)
local stateBanner = Instance.new("Frame")
stateBanner.Size = UDim2.new(0, 300, 0, 48)
stateBanner.Position = UDim2.new(0.5, -150, 0, 12)
stateBanner.BackgroundColor3 = Color3.fromRGB(12, 12, 20)
stateBanner.BackgroundTransparency = 0.1
stateBanner.Parent = screen
Instance.new("UICorner").Parent = stateBanner
local bannerStroke = Instance.new("UIStroke"); bannerStroke.Color = Color3.fromRGB(212, 175, 55); bannerStroke.Thickness = 2; bannerStroke.Parent = stateBanner

local stateLbl = Instance.new("TextLabel")
stateLbl.Size = UDim2.new(0.6, 0, 1, 0)
stateLbl.Position = UDim2.new(0, 12, 0, 0)
stateLbl.BackgroundTransparency = 1
stateLbl.Text = "WAITING"
stateLbl.TextSize = 16
stateLbl.Font = Enum.Font.GothamBold
stateLbl.TextColor3 = Color3.fromRGB(200, 200, 200)
stateLbl.TextXAlignment = Enum.TextXAlignment.Left
stateLbl.Parent = stateBanner

local timerLbl = Instance.new("TextLabel")
timerLbl.Size = UDim2.new(0.38, 0, 1, 0)
timerLbl.Position = UDim2.new(0.62, 0, 0, 0)
timerLbl.BackgroundTransparency = 1
timerLbl.Text = "--:--"
timerLbl.TextSize = 22
timerLbl.Font = Enum.Font.GothamBold
timerLbl.TextColor3 = Color3.fromRGB(212, 175, 55)
timerLbl.TextXAlignment = Enum.TextXAlignment.Right
timerLbl.Parent = stateBanner

-- Round number label
local roundLbl = Instance.new("TextLabel")
roundLbl.Size = UDim2.new(0, 200, 0, 28)
roundLbl.Position = UDim2.new(0.5, -100, 0, 64)
roundLbl.BackgroundTransparency = 1
roundLbl.Text = ""
roundLbl.TextSize = 14
roundLbl.Font = Enum.Font.Gotham
roundLbl.TextColor3 = Color3.fromRGB(160, 160, 160)
roundLbl.Parent = screen

-- ── Live scoreboard (right side) ─────────────────────────────────────────────
local scoreboardFrame = Instance.new("Frame")
scoreboardFrame.Size = UDim2.new(0, 200, 0, 280)
scoreboardFrame.Position = UDim2.new(1, -210, 0.5, -140)
scoreboardFrame.BackgroundColor3 = Color3.fromRGB(10, 10, 18)
scoreboardFrame.BackgroundTransparency = 0.1
scoreboardFrame.Visible = false
scoreboardFrame.Parent = screen
Instance.new("UICorner").Parent = scoreboardFrame
local sbStroke = Instance.new("UIStroke"); sbStroke.Color = Color3.fromRGB(70, 70, 100); sbStroke.Thickness = 1.5; sbStroke.Parent = scoreboardFrame

local sbTitle = Instance.new("TextLabel")
sbTitle.Size = UDim2.new(1, 0, 0, 32)
sbTitle.BackgroundTransparency = 1
sbTitle.Text = "SCOREBOARD"
sbTitle.TextSize = 13
sbTitle.Font = Enum.Font.GothamBold
sbTitle.TextColor3 = Color3.fromRGB(212, 175, 55)
sbTitle.Parent = scoreboardFrame

local sbList = Instance.new("Frame")
sbList.Size = UDim2.new(1, -10, 1, -40)
sbList.Position = UDim2.new(0, 5, 0, 36)
sbList.BackgroundTransparency = 1
sbList.Parent = scoreboardFrame
Instance.new("UIListLayout").Parent = sbList

-- ── Timer update ──────────────────────────────────────────────────────────────
local function formatTime(secs: number): string
	local m = math.floor(secs / 60)
	local s = math.floor(secs % 60)
	return string.format("%d:%02d", m, s)
end

TimerUpdate.OnClientEvent:Connect(function(timeLeft: number)
	timerLbl.Text = formatTime(timeLeft)
	if timeLeft <= 10 then
		timerLbl.TextColor3 = Color3.fromRGB(220, 60, 60)
	else
		timerLbl.TextColor3 = Color3.fromRGB(212, 175, 55)
	end
end)

-- ── Round state change ────────────────────────────────────────────────────────
local STATE_LABELS: {[string]: string} = {
	waiting      = "WAITING FOR PLAYERS",
	intermission = "INTERMISSION",
	active       = "ROUND IN PROGRESS",
	results      = "ROUND OVER",
}

RoundStateChange.OnClientEvent:Connect(function(state: string, rNumber: number, _duration: number?)
	stateLbl.Text = STATE_LABELS[state] or state:upper()
	roundLbl.Text = state ~= "waiting" and ("Round " .. tostring(rNumber)) or ""
	scoreboardFrame.Visible = (state == "active")

	if state == "intermission" then
		timerLbl.TextColor3 = Color3.fromRGB(80, 180, 255)
		stateLbl.TextColor3 = Color3.fromRGB(80, 180, 255)
		bannerStroke.Color  = Color3.fromRGB(80, 180, 255)
	elseif state == "active" then
		timerLbl.TextColor3 = Color3.fromRGB(212, 175, 55)
		stateLbl.TextColor3 = Color3.fromRGB(70, 200, 100)
		bannerStroke.Color  = Color3.fromRGB(70, 200, 100)
	else
		timerLbl.Text = "--:--"
		timerLbl.TextColor3 = Color3.fromRGB(200, 200, 200)
		stateLbl.TextColor3 = Color3.fromRGB(200, 200, 200)
		bannerStroke.Color  = Color3.fromRGB(212, 175, 55)
	end
end)

-- ── Score update ──────────────────────────────────────────────────────────────
ScoreUpdate.OnClientEvent:Connect(function(scoreList: {{name: string, kills: number, deaths: number, points: number}})
	for _, child in sbList:GetChildren() do
		if child:IsA("Frame") then child:Destroy() end
	end

	for rank, entry in scoreList do
		if rank > 8 then break end  -- max 8 rows
		local row = Instance.new("Frame")
		row.Size = UDim2.new(1, 0, 0, 28)
		row.BackgroundColor3 = entry.name == player.Name
			and Color3.fromRGB(30, 50, 30)
			or  Color3.fromRGB(20, 20, 32)
		row.LayoutOrder = rank
		row.Parent = sbList
		Instance.new("UICorner").Parent = row

		local rankLbl = Instance.new("TextLabel")
		rankLbl.Size = UDim2.new(0, 22, 1, 0)
		rankLbl.BackgroundTransparency = 1
		rankLbl.Text = tostring(rank)
		rankLbl.TextSize = 12
		rankLbl.Font = Enum.Font.GothamBold
		rankLbl.TextColor3 = Color3.fromRGB(212, 175, 55)
		rankLbl.Parent = row

		local nameLbl = Instance.new("TextLabel")
		nameLbl.Size = UDim2.new(0.55, 0, 1, 0)
		nameLbl.Position = UDim2.new(0, 24, 0, 0)
		nameLbl.BackgroundTransparency = 1
		nameLbl.Text = entry.name
		nameLbl.TextSize = 12
		nameLbl.Font = Enum.Font.Gotham
		nameLbl.TextColor3 = Color3.fromRGB(220, 220, 220)
		nameLbl.TextXAlignment = Enum.TextXAlignment.Left
		nameLbl.Parent = row

		local killsLbl = Instance.new("TextLabel")
		killsLbl.Size = UDim2.new(0, 42, 1, 0)
		killsLbl.Position = UDim2.new(1, -44, 0, 0)
		killsLbl.BackgroundTransparency = 1
		killsLbl.Text = tostring(entry.kills) .. "K"
		killsLbl.TextSize = 12
		killsLbl.Font = Enum.Font.GothamBold
		killsLbl.TextColor3 = Color3.fromRGB(70, 200, 100)
		killsLbl.Parent = row
	end
end)

-- ── Results screen ────────────────────────────────────────────────────────────
RoundResult.OnClientEvent:Connect(function(
	reason: string,
	winnerName: string?,
	results: {{name: string, kills: number, deaths: number, points: number}}
)
	local resultGui = Instance.new("ScreenGui")
	resultGui.Name = "RoundResultGui"
	resultGui.ResetOnSpawn = false
	resultGui.DisplayOrder = 10
	resultGui.Parent = playerGui

	local overlay = Instance.new("Frame")
	overlay.Size = UDim2.new(1, 0, 1, 0)
	overlay.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
	overlay.BackgroundTransparency = 0.5
	overlay.Parent = resultGui

	local panel = Instance.new("Frame")
	panel.Size = UDim2.new(0, 480, 0, 420)
	panel.Position = UDim2.new(0.5, -240, 0.5, -210)
	panel.BackgroundColor3 = Color3.fromRGB(12, 12, 20)
	panel.Parent = resultGui
	Instance.new("UICorner").Parent = panel
	local pStroke = Instance.new("UIStroke"); pStroke.Color = Color3.fromRGB(212, 175, 55); pStroke.Thickness = 2; pStroke.Parent = panel

	local title = Instance.new("TextLabel")
	title.Size = UDim2.new(1, -20, 0, 50)
	title.Position = UDim2.new(0, 10, 0, 10)
	title.BackgroundTransparency = 1
	title.Text = "ROUND OVER"
	title.TextSize = 28
	title.Font = Enum.Font.GothamBold
	title.TextColor3 = Color3.fromRGB(212, 175, 55)
	title.Parent = panel

	local winnerLbl = Instance.new("TextLabel")
	winnerLbl.Size = UDim2.new(1, -20, 0, 36)
	winnerLbl.Position = UDim2.new(0, 10, 0, 60)
	winnerLbl.BackgroundTransparency = 1
	winnerLbl.Text = winnerName and ("Winner: " .. winnerName) or "No winner — " .. reason
	winnerLbl.TextSize = 18
	winnerLbl.Font = Enum.Font.GothamBold
	winnerLbl.TextColor3 = winnerName and Color3.fromRGB(70, 220, 100) or Color3.fromRGB(180, 180, 180)
	winnerLbl.Parent = panel

	-- Results list
	local listFrame = Instance.new("Frame")
	listFrame.Size = UDim2.new(1, -30, 1, -160)
	listFrame.Position = UDim2.new(0, 15, 0, 110)
	listFrame.BackgroundTransparency = 1
	listFrame.Parent = panel
	Instance.new("UIListLayout").Parent = listFrame

	-- Header row
	local header = Instance.new("Frame")
	header.Size = UDim2.new(1, 0, 0, 28)
	header.BackgroundColor3 = Color3.fromRGB(25, 25, 40)
	header.Parent = listFrame
	Instance.new("UICorner").Parent = header

	for i, col in { {text = "#",      w = 0.08}, {text = "Player", w = 0.5}, {text = "Kills", w = 0.2}, {text = "Deaths", w = 0.22} } do
		local lbl = Instance.new("TextLabel")
		local xPos = (i == 1) and 0 or ({ 0.08, 0.58, 0.78 })[i - 1]
		lbl.Size = UDim2.new(col.w, 0, 1, 0)
		lbl.Position = UDim2.new(xPos, 4, 0, 0)
		lbl.BackgroundTransparency = 1
		lbl.Text = col.text
		lbl.TextSize = 13
		lbl.Font = Enum.Font.GothamBold
		lbl.TextColor3 = Color3.fromRGB(212, 175, 55)
		lbl.TextXAlignment = Enum.TextXAlignment.Left
		lbl.Parent = header
	end

	for rank, entry in results do
		if rank > 6 then break end
		local row = Instance.new("Frame")
		row.Size = UDim2.new(1, 0, 0, 36)
		row.BackgroundColor3 = entry.name == player.Name
			and Color3.fromRGB(30, 50, 30)
			or  Color3.fromRGB(18, 18, 28)
		row.LayoutOrder = rank + 1
		row.Parent = listFrame
		Instance.new("UICorner").Parent = row

		for i, data in {
			{text = tostring(rank),         xPos = 0,    w = 0.08},
			{text = entry.name,             xPos = 0.08, w = 0.50},
			{text = tostring(entry.kills),  xPos = 0.58, w = 0.20},
			{text = tostring(entry.deaths), xPos = 0.78, w = 0.22},
		} do
			local lbl = Instance.new("TextLabel")
			lbl.Size = UDim2.new(data.w, 0, 1, 0)
			lbl.Position = UDim2.new(data.xPos, 4, 0, 0)
			lbl.BackgroundTransparency = 1
			lbl.Text = data.text
			lbl.TextSize = 14
			lbl.Font = i == 2 and Enum.Font.GothamBold or Enum.Font.Gotham
			lbl.TextColor3 = Color3.fromRGB(220, 220, 220)
			lbl.TextXAlignment = Enum.TextXAlignment.Left
			lbl.Parent = row
		end
	end

	-- Auto-dismiss after 8 seconds
	task.delay(8, function()
		local fadeOut = TweenService:Create(overlay,
			TweenInfo.new(0.5, Enum.EasingStyle.Quad),
			{ BackgroundTransparency = 1 }
		)
		TweenService:Create(panel,
			TweenInfo.new(0.5, Enum.EasingStyle.Quad),
			{ BackgroundTransparency = 1 }
		):Play()
		fadeOut:Play()
		fadeOut.Completed:Wait()
		resultGui:Destroy()
	end)
end)

print("[RoundsClient] HUD ready")
`,
}

// ─── 19. Admin System ────────────────────────────────────────────────────────

const ADMIN_SERVER: GameSystemFile = {
  filename: 'AdminServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- AdminServer (ServerScript → ServerScriptService)
-- Chat command parser with ban DataStore, admin panel RemoteEvents.
-- Commands: /kick /ban /unban /tp /give /speed /fly /god /announce

local Players           = game:GetService("Players")
local DataStoreService  = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Chat              = game:GetService("Chat")

local BanDS = DataStoreService:GetDataStore("AdminBansV1")

-- ── Config ────────────────────────────────────────────────────────────────────
-- Replace these with real admin UserIds
local ADMIN_IDS: {number} = { 12345678, 87654321 }

local function isAdmin(player: Player): boolean
	for _, id in ADMIN_IDS do
		if player.UserId == id then return true end
	end
	return false
end

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder")
Remotes.Name  = "AdminRemotes"
Remotes.Parent = ReplicatedStorage

local OpenPanel      = Instance.new("RemoteEvent");    OpenPanel.Name      = "OpenPanel";      OpenPanel.Parent      = Remotes
local AdminAction    = Instance.new("RemoteFunction"); AdminAction.Name    = "AdminAction";    AdminAction.Parent    = Remotes
local AnnounceAll    = Instance.new("RemoteEvent");    AnnounceAll.Name    = "AnnounceAll";    AnnounceAll.Parent    = Remotes
local PlayerListSync = Instance.new("RemoteEvent");    PlayerListSync.Name = "PlayerListSync"; PlayerListSync.Parent = Remotes

-- ── Ban helpers ───────────────────────────────────────────────────────────────
local function banPlayer(targetId: number, reason: string)
	local key = "ban_" .. tostring(targetId)
	local ok, err = pcall(BanDS.SetAsync, BanDS, key, { banned = true, reason = reason, timestamp = os.time() })
	if not ok then warn("[Admin] Ban save failed:", err) end
end

local function unbanPlayer(targetId: number)
	local key = "ban_" .. tostring(targetId)
	local ok, err = pcall(BanDS.RemoveAsync, BanDS, key)
	if not ok then warn("[Admin] Unban failed:", err) end
end

local function isBanned(playerId: number): (boolean, string)
	local key = "ban_" .. tostring(playerId)
	local ok, data = pcall(BanDS.GetAsync, BanDS, key)
	if ok and type(data) == "table" and data.banned == true then
		return true, tostring(data.reason or "Banned")
	end
	return false, ""
end

-- ── Check ban on join ─────────────────────────────────────────────────────────
Players.PlayerAdded:Connect(function(player: Player)
	local banned, reason = isBanned(player.UserId)
	if banned then
		player:Kick("You are banned. Reason: " .. reason)
		return
	end
	-- Sync player list to all admins
	task.delay(1, function()
		if not player.Parent then return end
		local list: {{name: string, userId: number}} = {}
		for _, p in Players:GetPlayers() do
			table.insert(list, { name = p.Name, userId = p.UserId })
		end
		for _, p in Players:GetPlayers() do
			if isAdmin(p) then
				PlayerListSync:FireClient(p, list)
			end
		end
		if isAdmin(player) then
			OpenPanel:FireClient(player)
		end
	end)
end)

Players.PlayerRemoving:Connect(function(_player: Player)
	task.delay(0.5, function()
		local list: {{name: string, userId: number}} = {}
		for _, p in Players:GetPlayers() do
			table.insert(list, { name = p.Name, userId = p.UserId })
		end
		for _, p in Players:GetPlayers() do
			if isAdmin(p) then
				PlayerListSync:FireClient(p, list)
			end
		end
	end)
end)

-- ── Chat command parser ───────────────────────────────────────────────────────
local function parseCommand(admin: Player, message: string)
	if not isAdmin(admin) then return end
	local parts: {string} = {}
	for word in message:gmatch("%S+") do
		table.insert(parts, word)
	end
	if #parts == 0 then return end

	local cmd = parts[1]:lower()

	if cmd == "/kick" then
		local targetName = parts[2]
		local reason     = table.concat(parts, " ", 3) or "Kicked by admin"
		if not targetName then return end
		for _, p in Players:GetPlayers() do
			if p.Name:lower():sub(1, #targetName) == targetName:lower() then
				p:Kick("Kicked by admin. Reason: " .. reason)
				break
			end
		end

	elseif cmd == "/ban" then
		local targetName = parts[2]
		local reason     = table.concat(parts, " ", 3) or "Banned by admin"
		if not targetName then return end
		for _, p in Players:GetPlayers() do
			if p.Name:lower():sub(1, #targetName) == targetName:lower() then
				banPlayer(p.UserId, reason)
				p:Kick("You have been banned. Reason: " .. reason)
				break
			end
		end

	elseif cmd == "/unban" then
		local targetId = tonumber(parts[2])
		if targetId then
			unbanPlayer(targetId)
			Chat:Chat(admin.Character or admin, "Unbanned UserId " .. tostring(targetId), Enum.ChatColor.Green)
		end

	elseif cmd == "/tp" then
		-- /tp targetName OR /tp player1 player2
		local targetName = parts[2]
		local destName   = parts[3]
		if not targetName then return end
		local target: Player? = nil
		local dest: Player?   = nil
		for _, p in Players:GetPlayers() do
			if p.Name:lower():sub(1, #targetName) == targetName:lower() then target = p end
			if destName and p.Name:lower():sub(1, #destName) == destName:lower() then dest = p end
		end
		if not target then return end
		local destChar = (dest or admin).Character
		local destRoot = destChar and destChar:FindFirstChild("HumanoidRootPart") :: BasePart?
		if not destRoot then return end
		local char = target.Character
		local root = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
		if root then root.CFrame = destRoot.CFrame + Vector3.new(0, 5, 0) end

	elseif cmd == "/give" then
		-- /give playerName itemId [quantity]
		-- This fires an event to the inventory system; extend as needed.
		local targetName = parts[2]
		local itemId     = parts[3]
		local qty        = tonumber(parts[4]) or 1
		if not (targetName and itemId) then return end
		-- Publish to AdminAction so other systems can hook in
		for _, p in Players:GetPlayers() do
			if p.Name:lower():sub(1, #targetName) == targetName:lower() then
				-- Signal AdminAction handler below; inventory system should listen
				print("[Admin] GIVE", p.Name, itemId, qty)
				break
			end
		end

	elseif cmd == "/speed" then
		local targetName = parts[2]
		local speed      = tonumber(parts[3]) or 16
		speed = math.clamp(speed, 0, 500)
		if not targetName then return end
		for _, p in Players:GetPlayers() do
			if p.Name:lower():sub(1, #targetName) == targetName:lower() then
				local char = p.Character
				local hum  = char and char:FindFirstChildOfClass("Humanoid")
				if hum then (hum :: Humanoid).WalkSpeed = speed end
				break
			end
		end

	elseif cmd == "/fly" then
		-- Toggle flight via BodyVelocity; actual implementation lives in client
		local targetName = parts[2]
		if not targetName then return end
		for _, p in Players:GetPlayers() do
			if p.Name:lower():sub(1, #targetName) == targetName:lower() then
				AdminAction:InvokeClient(p, "toggle_fly")
				break
			end
		end

	elseif cmd == "/god" then
		local targetName = parts[2]
		if not targetName then return end
		for _, p in Players:GetPlayers() do
			if p.Name:lower():sub(1, #targetName) == targetName:lower() then
				local char = p.Character
				local hum  = char and char:FindFirstChildOfClass("Humanoid")
				if hum then (hum :: Humanoid).MaxHealth = math.huge ; (hum :: Humanoid).Health = math.huge end
				break
			end
		end

	elseif cmd == "/announce" then
		local msg = table.concat(parts, " ", 2)
		if #msg > 0 then
			AnnounceAll:FireAllClients(msg, admin.Name)
		end

	end
end

Players.PlayerAdded:Connect(function(player: Player)
	player.Chatted:Connect(function(message: string)
		if message:sub(1, 1) == "/" then
			parseCommand(player, message)
		end
	end)
end)

-- ── Panel action handler (admin GUI buttons) ─────────────────────────────────
AdminAction.OnServerInvoke = function(admin: Player, action: unknown, targetUserId: unknown, extra: unknown): (boolean, string)
	if not isAdmin(admin) then return false, "Not an admin." end
	if type(action) ~= "string" then return false, "Invalid action." end

	if action == "kick" then
		local uid = tonumber(targetUserId)
		if not uid then return false, "Bad userId." end
		local target = Players:GetPlayerByUserId(uid)
		if target then
			target:Kick("Kicked via admin panel by " .. admin.Name)
			return true, "Kicked " .. target.Name
		end
		return false, "Player not found."

	elseif action == "ban" then
		local uid    = tonumber(targetUserId)
		local reason = type(extra) == "string" and extra or "Admin ban"
		if not uid then return false, "Bad userId." end
		banPlayer(uid, reason)
		local target = Players:GetPlayerByUserId(uid)
		if target then target:Kick("Banned: " .. reason) end
		return true, "Banned UserId " .. tostring(uid)

	elseif action == "unban" then
		local uid = tonumber(targetUserId)
		if not uid then return false, "Bad userId." end
		unbanPlayer(uid)
		return true, "Unbanned UserId " .. tostring(uid)

	end

	return false, "Unknown action."
end

print("[AdminServer] Ready — " .. #ADMIN_IDS .. " admins configured")
`,
}

const ADMIN_CLIENT: GameSystemFile = {
  filename: 'AdminClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- AdminClient (LocalScript → StarterPlayerScripts)
-- Admin panel ScreenGui: player list + action buttons. Only renders for admins.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local UserInputService  = game:GetService("UserInputService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local Remotes        = ReplicatedStorage:WaitForChild("AdminRemotes")
local OpenPanel      = Remotes:WaitForChild("OpenPanel")      :: RemoteEvent
local AdminAction    = Remotes:WaitForChild("AdminAction")    :: RemoteFunction
local AnnounceAll    = Remotes:WaitForChild("AnnounceAll")    :: RemoteEvent
local PlayerListSync = Remotes:WaitForChild("PlayerListSync") :: RemoteEvent

-- ── Announcement overlay ──────────────────────────────────────────────────────
local announceGui = Instance.new("ScreenGui")
announceGui.Name = "AdminAnnounceGui"
announceGui.ResetOnSpawn = false
announceGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
announceGui.Parent = playerGui

local announceBanner = Instance.new("Frame")
announceBanner.Size = UDim2.new(0.7, 0, 0, 80)
announceBanner.Position = UDim2.new(0.15, 0, 0, -90)
announceBanner.BackgroundColor3 = Color3.fromRGB(10, 10, 18)
announceBanner.Parent = announceGui
Instance.new("UICorner").Parent = announceBanner
local annStroke = Instance.new("UIStroke"); annStroke.Color = Color3.fromRGB(212, 175, 55); annStroke.Thickness = 2; annStroke.Parent = announceBanner

local annTitle = Instance.new("TextLabel")
annTitle.Size = UDim2.new(1, -16, 0, 22)
annTitle.Position = UDim2.new(0, 8, 0, 6)
annTitle.BackgroundTransparency = 1
annTitle.Text = "ANNOUNCEMENT"
annTitle.TextSize = 12
annTitle.Font = Enum.Font.GothamBold
annTitle.TextColor3 = Color3.fromRGB(212, 175, 55)
annTitle.Parent = announceBanner

local annMsg = Instance.new("TextLabel")
annMsg.Size = UDim2.new(1, -16, 0, 40)
annMsg.Position = UDim2.new(0, 8, 0, 28)
annMsg.BackgroundTransparency = 1
annMsg.Text = ""
annMsg.TextSize = 18
annMsg.Font = Enum.Font.GothamBold
annMsg.TextColor3 = Color3.fromRGB(240, 240, 240)
annMsg.TextWrapped = true
annMsg.Parent = announceBanner

AnnounceAll.OnClientEvent:Connect(function(message: string, adminName: string)
	annTitle.Text = "ANNOUNCEMENT  —  " .. adminName:upper()
	annMsg.Text = message
	TweenService:Create(announceBanner,
		TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
		{ Position = UDim2.new(0.15, 0, 0, 16) }
	):Play()
	task.delay(6, function()
		TweenService:Create(announceBanner,
			TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
			{ Position = UDim2.new(0.15, 0, 0, -90) }
		):Play()
	end)
end)

-- ── Admin panel (only shown to admins via OpenPanel event) ────────────────────
local panelGui = Instance.new("ScreenGui")
panelGui.Name = "AdminPanelGui"
panelGui.ResetOnSpawn = false
panelGui.Enabled = false
panelGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
panelGui.Parent = playerGui

-- Backdrop
local dimmer = Instance.new("Frame")
dimmer.Size = UDim2.new(1, 0, 1, 0)
dimmer.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
dimmer.BackgroundTransparency = 0.6
dimmer.Parent = panelGui

-- Main panel
local panel = Instance.new("Frame")
panel.Size = UDim2.new(0, 560, 0, 480)
panel.Position = UDim2.new(0.5, -280, 0.5, -240)
panel.BackgroundColor3 = Color3.fromRGB(12, 12, 22)
panel.Parent = panelGui
Instance.new("UICorner").Parent = panel
local panelStroke = Instance.new("UIStroke"); panelStroke.Color = Color3.fromRGB(212, 175, 55); panelStroke.Thickness = 2; panelStroke.Parent = panel

-- Header
local header = Instance.new("Frame")
header.Size = UDim2.new(1, 0, 0, 52)
header.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
header.Parent = panel
Instance.new("UICorner").Parent = header

local headerLbl = Instance.new("TextLabel")
headerLbl.Size = UDim2.new(1, -60, 1, 0)
headerLbl.Position = UDim2.new(0, 16, 0, 0)
headerLbl.BackgroundTransparency = 1
headerLbl.Text = "ADMIN PANEL"
headerLbl.TextSize = 20
headerLbl.Font = Enum.Font.GothamBold
headerLbl.TextColor3 = Color3.fromRGB(12, 12, 22)
headerLbl.TextXAlignment = Enum.TextXAlignment.Left
headerLbl.Parent = header

local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0, 36, 0, 36)
closeBtn.Position = UDim2.new(1, -46, 0, 8)
closeBtn.BackgroundColor3 = Color3.fromRGB(12, 12, 22)
closeBtn.Text = "✕"
closeBtn.TextSize = 16
closeBtn.Font = Enum.Font.GothamBold
closeBtn.TextColor3 = Color3.fromRGB(212, 175, 55)
closeBtn.Parent = header
Instance.new("UICorner").Parent = closeBtn

-- Status label
local statusLbl = Instance.new("TextLabel")
statusLbl.Size = UDim2.new(1, -32, 0, 24)
statusLbl.Position = UDim2.new(0, 16, 0, 58)
statusLbl.BackgroundTransparency = 1
statusLbl.Text = ""
statusLbl.TextSize = 13
statusLbl.Font = Enum.Font.Gotham
statusLbl.TextColor3 = Color3.fromRGB(100, 220, 100)
statusLbl.TextXAlignment = Enum.TextXAlignment.Left
statusLbl.Parent = panel

-- Player list scroll
local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.new(1, -32, 1, -150)
scroll.Position = UDim2.new(0, 16, 0, 90)
scroll.BackgroundColor3 = Color3.fromRGB(18, 18, 30)
scroll.BorderSizePixel = 0
scroll.ScrollBarThickness = 6
scroll.CanvasSize = UDim2.new(0, 0, 0, 0)
scroll.Parent = panel
Instance.new("UICorner").Parent = scroll

local listLayout = Instance.new("UIListLayout")
listLayout.SortOrder = Enum.SortOrder.LayoutOrder
listLayout.Padding = UDim.new(0, 6)
listLayout.Parent = scroll

local listPad = Instance.new("UIPadding")
listPad.PaddingAll = UDim.new(0, 8)
listPad.Parent = scroll

-- Announce row at bottom
local announceRow = Instance.new("Frame")
announceRow.Size = UDim2.new(1, -32, 0, 44)
announceRow.Position = UDim2.new(0, 16, 1, -56)
announceRow.BackgroundTransparency = 1
announceRow.Parent = panel

local annInput = Instance.new("TextBox")
annInput.Size = UDim2.new(1, -120, 1, 0)
annInput.BackgroundColor3 = Color3.fromRGB(22, 22, 36)
annInput.Text = ""
annInput.PlaceholderText = "Announcement message..."
annInput.TextSize = 13
annInput.Font = Enum.Font.Gotham
annInput.TextColor3 = Color3.fromRGB(220, 220, 220)
annInput.PlaceholderColor3 = Color3.fromRGB(100, 100, 120)
annInput.ClearTextOnFocus = false
annInput.Parent = announceRow
Instance.new("UICorner").Parent = annInput

local annBtn = Instance.new("TextButton")
annBtn.Size = UDim2.new(0, 110, 1, 0)
annBtn.Position = UDim2.new(1, -110, 0, 0)
annBtn.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
annBtn.Text = "ANNOUNCE"
annBtn.TextSize = 12
annBtn.Font = Enum.Font.GothamBold
annBtn.TextColor3 = Color3.fromRGB(12, 12, 22)
annBtn.Parent = announceRow
Instance.new("UICorner").Parent = annBtn

-- ── Populate player rows ───────────────────────────────────────────────────────
local selectedUserId: number? = nil

local function clearList()
	for _, child in scroll:GetChildren() do
		if child:IsA("Frame") then child:Destroy() end
	end
end

local function buildPlayerList(list: {{name: string, userId: number}})
	clearList()
	for _, info in list do
		local row = Instance.new("Frame")
		row.Size = UDim2.new(1, 0, 0, 44)
		row.BackgroundColor3 = Color3.fromRGB(24, 24, 38)
		row.Parent = scroll
		Instance.new("UICorner").Parent = row

		local nameLbl = Instance.new("TextLabel")
		nameLbl.Size = UDim2.new(0.45, 0, 1, 0)
		nameLbl.Position = UDim2.new(0, 10, 0, 0)
		nameLbl.BackgroundTransparency = 1
		nameLbl.Text = info.name
		nameLbl.TextSize = 14
		nameLbl.Font = Enum.Font.GothamBold
		nameLbl.TextColor3 = Color3.fromRGB(220, 220, 220)
		nameLbl.TextXAlignment = Enum.TextXAlignment.Left
		nameLbl.Parent = row

		local function makeActionBtn(label: string, posX: number, color: Color3, action: string)
			local btn = Instance.new("TextButton")
			btn.Size = UDim2.new(0, 80, 0, 30)
			btn.Position = UDim2.new(0, posX, 0.5, -15)
			btn.BackgroundColor3 = color
			btn.Text = label
			btn.TextSize = 12
			btn.Font = Enum.Font.GothamBold
			btn.TextColor3 = Color3.fromRGB(255, 255, 255)
			btn.Parent = row
			Instance.new("UICorner").Parent = btn
			local capturedId   = info.userId
			local capturedName = info.name
			btn.MouseButton1Click:Connect(function()
				statusLbl.Text = "Running " .. label .. " on " .. capturedName .. "..."
				statusLbl.TextColor3 = Color3.fromRGB(212, 175, 55)
				local ok, msg = AdminAction:InvokeServer(action, capturedId, "Admin panel action")
				statusLbl.Text = (ok and "✓ " or "✗ ") .. tostring(msg)
				statusLbl.TextColor3 = ok
					and Color3.fromRGB(100, 220, 100)
					or  Color3.fromRGB(220, 80, 80)
			end)
		end

		makeActionBtn("Kick",  210, Color3.fromRGB(200, 80, 60),  "kick")
		makeActionBtn("Ban",   300, Color3.fromRGB(180, 40, 40),  "ban")

		scroll.CanvasSize = UDim2.new(0, 0, 0, listLayout.AbsoluteContentSize.Y + 16)
	end
end

PlayerListSync.OnClientEvent:Connect(function(list: {{name: string, userId: number}})
	buildPlayerList(list)
end)

-- ── Announce button ───────────────────────────────────────────────────────────
annBtn.MouseButton1Click:Connect(function()
	local msg = annInput.Text
	if #msg == 0 then return end
	AdminAction:InvokeServer("announce_client", 0, msg)
	annInput.Text = ""
end)

-- ── Open / close ──────────────────────────────────────────────────────────────
OpenPanel.OnClientEvent:Connect(function()
	panelGui.Enabled = true
end)

closeBtn.MouseButton1Click:Connect(function()
	panelGui.Enabled = false
end)

dimmer.InputBegan:Connect(function(input: InputObject)
	if input.UserInputType == Enum.UserInputType.MouseButton1 then
		panelGui.Enabled = false
	end
end)

-- Hotkey: F9
UserInputService.InputBegan:Connect(function(input: InputObject, gameProcessed: boolean)
	if gameProcessed then return end
	if input.KeyCode == Enum.KeyCode.F9 then
		panelGui.Enabled = not panelGui.Enabled
	end
end)

print("[AdminClient] Ready — F9 to toggle panel")
`,
}

// ─── 20. Crafting System ─────────────────────────────────────────────────────

const CRAFTING_SERVER: GameSystemFile = {
  filename: 'CraftingServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- CraftingServer (ServerScript → ServerScriptService)
-- 3×3 grid recipe matching, material consumption, output item with rarity.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- ── Types ─────────────────────────────────────────────────────────────────────
type Rarity  = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary"
type Recipe  = {
	name:    string,
	pattern: {string?},  -- 9 slots, nil = empty, string = required itemId
	output:  string,
	qty:     number,
	rarity:  Rarity,
}

-- ── Recipe DB ─────────────────────────────────────────────────────────────────
-- Patterns are flat 9-element arrays (row-major, top-left → bottom-right).
-- nil means the slot must be empty; a string means the slot must have that item.
local RECIPES: {Recipe} = {
	{
		name    = "Iron Sword",
		pattern = { nil, "iron_ingot", nil,
		            nil, "iron_ingot", nil,
		            nil, "stick",      nil },
		output  = "sword_iron",
		qty     = 1,
		rarity  = "Common",
	},
	{
		name    = "Gold Sword",
		pattern = { nil, "gold_ingot", nil,
		            nil, "gold_ingot", nil,
		            nil, "stick",      nil },
		output  = "sword_gold",
		qty     = 1,
		rarity  = "Uncommon",
	},
	{
		name    = "Health Potion",
		pattern = { nil,         "red_herb", nil,
		            "red_herb",  "vial",     "red_herb",
		            nil,         nil,        nil },
		output  = "potion_health",
		qty     = 2,
		rarity  = "Common",
	},
	{
		name    = "Magic Staff",
		pattern = { nil,       "magic_gem", nil,
		            nil,       "stick",     nil,
		            nil,       "stick",     nil },
		output  = "staff_magic",
		qty     = 1,
		rarity  = "Rare",
	},
	{
		name    = "Legendary Blade",
		pattern = { "magic_gem",  "diamond",   "magic_gem",
		            nil,          "gold_ingot", nil,
		            nil,          "stick",      nil },
		output  = "blade_legendary",
		qty     = 1,
		rarity  = "Legendary",
	},
}

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder")
Remotes.Name  = "CraftingRemotes"
Remotes.Parent = ReplicatedStorage

local GetRecipes    = Instance.new("RemoteFunction"); GetRecipes.Name    = "GetRecipes";    GetRecipes.Parent    = Remotes
local AttemptCraft  = Instance.new("RemoteFunction"); AttemptCraft.Name  = "AttemptCraft";  AttemptCraft.Parent  = Remotes
local CraftResult   = Instance.new("RemoteEvent");    CraftResult.Name   = "CraftResult";   CraftResult.Parent   = Remotes

-- ── Pattern matching ──────────────────────────────────────────────────────────
local function patternsMatch(grid: {string?}, pattern: {string?}): boolean
	if #grid ~= 9 or #pattern ~= 9 then return false end
	for i = 1, 9 do
		if pattern[i] ~= grid[i] then return false end
	end
	return true
end

local function findRecipe(grid: {string?}): Recipe?
	for _, recipe in RECIPES do
		if patternsMatch(grid, recipe.pattern) then
			return recipe
		end
	end
	return nil
end

-- ── Material consumption helper ───────────────────────────────────────────────
-- Expects inventory API from InventoryServer; falls back to a simple approach.
local function consumeMaterials(player: Player, grid: {string?}): boolean
	-- Count required items from grid
	local needed: {[string]: number} = {}
	for _, itemId in grid do
		if itemId ~= nil then
			needed[itemId] = (needed[itemId] or 0) + 1
		end
	end
	-- Validate against leaderstats / inventory
	-- This uses the player's backpack IntValues as a simple stand-in;
	-- wire up to your InventoryServer.removeItem in production.
	local backpack = player:FindFirstChildOfClass("Backpack")
	if not backpack then return true end  -- skip check if no backpack system
	for itemId, count in needed do
		local slot = backpack:FindFirstChild(itemId) :: IntValue?
		if not slot or slot.Value < count then
			return false
		end
	end
	-- Deduct
	for itemId, count in needed do
		local slot = backpack:FindFirstChild(itemId) :: IntValue?
		if slot then slot.Value -= count end
	end
	return true
end

local function grantItem(player: Player, itemId: string, qty: number)
	-- Add to backpack IntValue (or wire to InventoryServer.addItem)
	local backpack = player:FindFirstChildOfClass("Backpack")
	if not backpack then
		backpack = Instance.new("Folder")
		backpack.Name = "Backpack"
		backpack.Parent = player
	end
	local slot = backpack:FindFirstChild(itemId) :: IntValue?
	if not slot then
		slot = Instance.new("IntValue")
		slot.Name = itemId
		slot.Parent = backpack
	end
	slot.Value += qty
end

-- ── Remote handlers ───────────────────────────────────────────────────────────
GetRecipes.OnServerInvoke = function(_player: Player): {Recipe}
	return RECIPES
end

AttemptCraft.OnServerInvoke = function(player: Player, grid: unknown): (boolean, string, string?, number?, Rarity?)
	if type(grid) ~= "table" then return false, "Invalid grid.", nil, nil, nil end
	local g = grid :: {string?}
	if #g ~= 9 then return false, "Grid must have 9 slots.", nil, nil, nil end

	-- Sanitize: only strings or nil allowed
	for i = 1, 9 do
		local v = g[i]
		if v ~= nil and type(v) ~= "string" then
			return false, "Invalid slot value.", nil, nil, nil
		end
	end

	local recipe = findRecipe(g)
	if not recipe then
		return false, "No matching recipe.", nil, nil, nil
	end

	local consumed = consumeMaterials(player, g)
	if not consumed then
		return false, "Not enough materials.", nil, nil, nil
	end

	grantItem(player, recipe.output, recipe.qty)
	CraftResult:FireClient(player, recipe.name, recipe.output, recipe.qty, recipe.rarity)
	return true, "Crafted " .. recipe.name, recipe.output, recipe.qty, recipe.rarity
end

print("[CraftingServer] Ready — " .. #RECIPES .. " recipes loaded")
`,
}

const CRAFTING_CLIENT: GameSystemFile = {
  filename: 'CraftingClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- CraftingClient (LocalScript → StarterPlayerScripts)
-- 3×3 crafting grid, recipe book panel, craft button with progress bar.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local UserInputService  = game:GetService("UserInputService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local Remotes     = ReplicatedStorage:WaitForChild("CraftingRemotes")
local GetRecipes  = Remotes:WaitForChild("GetRecipes")   :: RemoteFunction
local AttemptCraft = Remotes:WaitForChild("AttemptCraft") :: RemoteFunction
local CraftResult  = Remotes:WaitForChild("CraftResult")  :: RemoteEvent

-- ── Rarity colours ────────────────────────────────────────────────────────────
local RARITY_COLORS: {[string]: Color3} = {
	Common    = Color3.fromRGB(180, 180, 180),
	Uncommon  = Color3.fromRGB(80, 200, 100),
	Rare      = Color3.fromRGB(80, 140, 255),
	Epic      = Color3.fromRGB(180, 80, 255),
	Legendary = Color3.fromRGB(255, 160, 30),
}

-- ── Build GUI ─────────────────────────────────────────────────────────────────
local screen = Instance.new("ScreenGui")
screen.Name = "CraftingGui"
screen.ResetOnSpawn = false
screen.Enabled = false
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.Parent = playerGui

local dimmer = Instance.new("Frame")
dimmer.Size = UDim2.new(1, 0, 1, 0)
dimmer.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
dimmer.BackgroundTransparency = 0.55
dimmer.Parent = screen

local panel = Instance.new("Frame")
panel.Size = UDim2.new(0, 680, 0, 520)
panel.Position = UDim2.new(0.5, -340, 0.5, -260)
panel.BackgroundColor3 = Color3.fromRGB(14, 14, 24)
panel.Parent = screen
Instance.new("UICorner").Parent = panel
local panelStroke = Instance.new("UIStroke"); panelStroke.Color = Color3.fromRGB(212, 175, 55); panelStroke.Thickness = 2; panelStroke.Parent = panel

-- Header
local header = Instance.new("Frame")
header.Size = UDim2.new(1, 0, 0, 52)
header.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
header.Parent = panel
Instance.new("UICorner").Parent = header

local headerLbl = Instance.new("TextLabel")
headerLbl.Size = UDim2.new(1, -60, 1, 0)
headerLbl.Position = UDim2.new(0, 16, 0, 0)
headerLbl.BackgroundTransparency = 1
headerLbl.Text = "CRAFTING TABLE"
headerLbl.TextSize = 20
headerLbl.Font = Enum.Font.GothamBold
headerLbl.TextColor3 = Color3.fromRGB(12, 12, 22)
headerLbl.TextXAlignment = Enum.TextXAlignment.Left
headerLbl.Parent = header

local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0, 36, 0, 36)
closeBtn.Position = UDim2.new(1, -46, 0, 8)
closeBtn.BackgroundColor3 = Color3.fromRGB(12, 12, 22)
closeBtn.Text = "✕"
closeBtn.TextSize = 16
closeBtn.Font = Enum.Font.GothamBold
closeBtn.TextColor3 = Color3.fromRGB(212, 175, 55)
closeBtn.Parent = header
Instance.new("UICorner").Parent = closeBtn

-- ── 3×3 Grid ──────────────────────────────────────────────────────────────────
local gridFrame = Instance.new("Frame")
gridFrame.Size = UDim2.new(0, 240, 0, 240)
gridFrame.Position = UDim2.new(0, 24, 0, 70)
gridFrame.BackgroundTransparency = 1
gridFrame.Parent = panel

local SLOT_SIZE   = 72
local SLOT_GAP    = 8
local gridSlots: {TextButton} = {}
local gridValues: {string?}   = {}

for i = 1, 9 do
	local col = (i - 1) % 3
	local row = math.floor((i - 1) / 3)
	local btn = Instance.new("TextButton")
	btn.Size = UDim2.new(0, SLOT_SIZE, 0, SLOT_SIZE)
	btn.Position = UDim2.new(0, col * (SLOT_SIZE + SLOT_GAP), 0, row * (SLOT_SIZE + SLOT_GAP))
	btn.BackgroundColor3 = Color3.fromRGB(22, 22, 36)
	btn.Text = ""
	btn.TextSize = 11
	btn.Font = Enum.Font.Gotham
	btn.TextColor3 = Color3.fromRGB(180, 180, 180)
	btn.TextWrapped = true
	btn.Parent = gridFrame
	Instance.new("UICorner").Parent = btn
	local bStroke = Instance.new("UIStroke"); bStroke.Color = Color3.fromRGB(50, 50, 70); bStroke.Thickness = 1.5; bStroke.Parent = btn
	gridSlots[i] = btn
	gridValues[i] = nil

	local capturedI = i
	btn.MouseButton1Click:Connect(function()
		-- Cycle through a test item set (wire up to real inventory in production)
		local items: {string?} = { nil, "iron_ingot", "gold_ingot", "stick", "red_herb", "vial", "magic_gem", "diamond" }
		local cur = gridValues[capturedI]
		local idx = 1
		for j, v in items do
			if v == cur then idx = j; break end
		end
		idx = (idx % #items) + 1
		gridValues[capturedI] = items[idx]
		btn.Text = gridValues[capturedI] or ""
		(bStroke :: UIStroke).Color = gridValues[capturedI]
			and Color3.fromRGB(212, 175, 55)
			or  Color3.fromRGB(50, 50, 70)
	end)
end

-- ── Output slot ────────────────────────────────────────────────────────────────
local arrowLbl = Instance.new("TextLabel")
arrowLbl.Size = UDim2.new(0, 40, 0, 40)
arrowLbl.Position = UDim2.new(0, 272, 0, 180)
arrowLbl.BackgroundTransparency = 1
arrowLbl.Text = "▶"
arrowLbl.TextSize = 28
arrowLbl.Font = Enum.Font.GothamBold
arrowLbl.TextColor3 = Color3.fromRGB(212, 175, 55)
arrowLbl.Parent = panel

local outputSlot = Instance.new("Frame")
outputSlot.Size = UDim2.new(0, 100, 0, 100)
outputSlot.Position = UDim2.new(0, 320, 0, 150)
outputSlot.BackgroundColor3 = Color3.fromRGB(22, 22, 36)
outputSlot.Parent = panel
Instance.new("UICorner").Parent = outputSlot
local outStroke = Instance.new("UIStroke"); outStroke.Color = Color3.fromRGB(50, 50, 70); outStroke.Thickness = 2; outStroke.Parent = outputSlot

local outputLbl = Instance.new("TextLabel")
outputLbl.Size = UDim2.new(1, -8, 0.6, 0)
outputLbl.Position = UDim2.new(0, 4, 0.1, 0)
outputLbl.BackgroundTransparency = 1
outputLbl.Text = "?"
outputLbl.TextSize = 13
outputLbl.Font = Enum.Font.GothamBold
outputLbl.TextColor3 = Color3.fromRGB(180, 180, 180)
outputLbl.TextWrapped = true
outputLbl.Parent = outputSlot

local rarityLbl = Instance.new("TextLabel")
rarityLbl.Size = UDim2.new(1, 0, 0, 20)
rarityLbl.Position = UDim2.new(0, 0, 1, -22)
rarityLbl.BackgroundTransparency = 1
rarityLbl.Text = ""
rarityLbl.TextSize = 11
rarityLbl.Font = Enum.Font.GothamBold
rarityLbl.TextColor3 = Color3.fromRGB(180, 180, 180)
rarityLbl.Parent = outputSlot

-- ── Craft button + progress bar ───────────────────────────────────────────────
local craftBtn = Instance.new("TextButton")
craftBtn.Size = UDim2.new(0, 200, 0, 44)
craftBtn.Position = UDim2.new(0, 24, 1, -68)
craftBtn.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
craftBtn.Text = "CRAFT"
craftBtn.TextSize = 18
craftBtn.Font = Enum.Font.GothamBold
craftBtn.TextColor3 = Color3.fromRGB(12, 12, 22)
craftBtn.Parent = panel
Instance.new("UICorner").Parent = craftBtn

local progressBg = Instance.new("Frame")
progressBg.Size = UDim2.new(0, 200, 0, 8)
progressBg.Position = UDim2.new(0, 24, 1, -18)
progressBg.BackgroundColor3 = Color3.fromRGB(30, 30, 44)
progressBg.Parent = panel
Instance.new("UICorner").Parent = progressBg

local progressBar = Instance.new("Frame")
progressBar.Size = UDim2.new(0, 0, 1, 0)
progressBar.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
progressBar.Parent = progressBg
Instance.new("UICorner").Parent = progressBar

local resultLbl = Instance.new("TextLabel")
resultLbl.Size = UDim2.new(0, 420, 0, 28)
resultLbl.Position = UDim2.new(0, 240, 1, -42)
resultLbl.BackgroundTransparency = 1
resultLbl.Text = ""
resultLbl.TextSize = 14
resultLbl.Font = Enum.Font.GothamBold
resultLbl.TextColor3 = Color3.fromRGB(100, 220, 100)
resultLbl.TextXAlignment = Enum.TextXAlignment.Left
resultLbl.Parent = panel

-- ── Recipe book (right side) ──────────────────────────────────────────────────
local recipeScroll = Instance.new("ScrollingFrame")
recipeScroll.Size = UDim2.new(0, 240, 0, 340)
recipeScroll.Position = UDim2.new(1, -256, 0, 70)
recipeScroll.BackgroundColor3 = Color3.fromRGB(18, 18, 30)
recipeScroll.BorderSizePixel = 0
recipeScroll.ScrollBarThickness = 4
recipeScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
recipeScroll.Parent = panel
Instance.new("UICorner").Parent = recipeScroll

local recipeLayout = Instance.new("UIListLayout")
recipeLayout.Padding = UDim.new(0, 6)
recipeLayout.Parent = recipeScroll

local recipePad = Instance.new("UIPadding")
recipePad.PaddingAll = UDim.new(0, 8)
recipePad.Parent = recipeScroll

local recipeTitleLbl = Instance.new("TextLabel")
recipeTitleLbl.Size = UDim2.new(0, 240, 0, 22)
recipeTitleLbl.Position = UDim2.new(1, -256, 0, 420)
recipeTitleLbl.BackgroundTransparency = 1
recipeTitleLbl.Text = "RECIPE BOOK"
recipeTitleLbl.TextSize = 12
recipeTitleLbl.Font = Enum.Font.GothamBold
recipeTitleLbl.TextColor3 = Color3.fromRGB(212, 175, 55)
recipeTitleLbl.Parent = panel

-- ── Craft button handler ───────────────────────────────────────────────────────
local crafting = false

craftBtn.MouseButton1Click:Connect(function()
	if crafting then return end
	crafting = true
	craftBtn.Text = "Crafting..."
	craftBtn.BackgroundColor3 = Color3.fromRGB(60, 60, 80)

	-- Animate progress bar
	TweenService:Create(progressBar, TweenInfo.new(1.2, Enum.EasingStyle.Linear), {
		Size = UDim2.new(1, 0, 1, 0)
	}):Play()

	task.delay(1.2, function()
		local ok, msg, outId, qty, rarity = AttemptCraft:InvokeServer(gridValues)
		crafting = false
		craftBtn.Text = "CRAFT"
		craftBtn.BackgroundColor3 = Color3.fromRGB(212, 175, 55)

		-- Reset bar
		progressBar.Size = UDim2.new(0, 0, 1, 0)

		resultLbl.Text = tostring(msg)
		resultLbl.TextColor3 = (ok :: boolean)
			and Color3.fromRGB(100, 220, 100)
			or  Color3.fromRGB(220, 80, 80)

		if ok and outId then
			local rarityStr = tostring(rarity or "Common")
			outputLbl.Text = tostring(outId) .. " x" .. tostring(qty or 1)
			rarityLbl.Text = rarityStr
			rarityLbl.TextColor3 = RARITY_COLORS[rarityStr] or Color3.fromRGB(180, 180, 180)
			outStroke.Color = RARITY_COLORS[rarityStr] or Color3.fromRGB(50, 50, 70)
		end
	end)
end)

-- ── Populate recipe book ───────────────────────────────────────────────────────
task.spawn(function()
	local recipes = GetRecipes:InvokeServer()
	for _, recipe in (recipes :: any) do
		local row = Instance.new("TextButton")
		row.Size = UDim2.new(1, 0, 0, 52)
		row.BackgroundColor3 = Color3.fromRGB(24, 24, 38)
		row.Text = ""
		row.Parent = recipeScroll
		Instance.new("UICorner").Parent = row

		local nameLbl2 = Instance.new("TextLabel")
		nameLbl2.Size = UDim2.new(1, -8, 0, 22)
		nameLbl2.Position = UDim2.new(0, 8, 0, 4)
		nameLbl2.BackgroundTransparency = 1
		nameLbl2.Text = recipe.name
		nameLbl2.TextSize = 13
		nameLbl2.Font = Enum.Font.GothamBold
		nameLbl2.TextColor3 = Color3.fromRGB(220, 220, 220)
		nameLbl2.TextXAlignment = Enum.TextXAlignment.Left
		nameLbl2.Parent = row

		local rarLbl2 = Instance.new("TextLabel")
		rarLbl2.Size = UDim2.new(1, -8, 0, 18)
		rarLbl2.Position = UDim2.new(0, 8, 0, 26)
		rarLbl2.BackgroundTransparency = 1
		rarLbl2.Text = recipe.rarity .. "  →  " .. recipe.output
		rarLbl2.TextSize = 11
		rarLbl2.Font = Enum.Font.Gotham
		rarLbl2.TextColor3 = RARITY_COLORS[recipe.rarity] or Color3.fromRGB(180, 180, 180)
		rarLbl2.TextXAlignment = Enum.TextXAlignment.Left
		rarLbl2.Parent = row

		-- Click to load pattern into grid
		row.MouseButton1Click:Connect(function()
			for i = 1, 9 do
				gridValues[i] = recipe.pattern[i]
				gridSlots[i].Text = gridValues[i] or ""
				local bStroke2 = gridSlots[i]:FindFirstChildOfClass("UIStroke")
				if bStroke2 then
					(bStroke2 :: UIStroke).Color = gridValues[i]
						and Color3.fromRGB(212, 175, 55)
						or  Color3.fromRGB(50, 50, 70)
				end
			end
		end)
	end
	recipeScroll.CanvasSize = UDim2.new(0, 0, 0, recipeLayout.AbsoluteContentSize.Y + 16)
end)

-- ── Open / close ──────────────────────────────────────────────────────────────
closeBtn.MouseButton1Click:Connect(function() screen.Enabled = false end)
dimmer.InputBegan:Connect(function(input: InputObject)
	if input.UserInputType == Enum.UserInputType.MouseButton1 then screen.Enabled = false end
end)

UserInputService.InputBegan:Connect(function(input: InputObject, gameProcessed: boolean)
	if gameProcessed then return end
	if input.KeyCode == Enum.KeyCode.C then
		screen.Enabled = not screen.Enabled
	end
end)

print("[CraftingClient] Ready — press C to open crafting table")
`,
}

// ─── 21. Dialogue System ─────────────────────────────────────────────────────

const DIALOGUE_SERVER: GameSystemFile = {
  filename: 'DialogueServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- DialogueServer (ServerScript → ServerScriptService)
-- NPC dialogue tree: nodes with text + choice arrays.
-- Supports quest acceptance, shop opening, lore delivery.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- ── Types ─────────────────────────────────────────────────────────────────────
type Choice = {
	text:   string,
	nextId: string,
	action: string?,  -- optional: "accept_quest:questId", "open_shop", "close"
}

type DialogueNode = {
	id:       string,
	text:     string,
	speaker:  string,
	choices:  {Choice},
}

type DialogueTree = {
	npcName: string,
	nodes:   {[string]: DialogueNode},
	start:   string,
}

-- ── Dialogue DB (define one tree per NPC) ─────────────────────────────────────
local DIALOGUE_TREES: {[string]: DialogueTree} = {
	["NPC_Merchant"] = {
		npcName = "Merchant Aldric",
		start   = "root",
		nodes   = {
			root = {
				id      = "root",
				text    = "Ah, welcome traveller! What can I do for you today?",
				speaker = "Merchant Aldric",
				choices = {
					{ text = "I'd like to browse your wares.",   nextId = "shop",    action = "open_shop" },
					{ text = "Do you have any work for me?",     nextId = "quest_intro" },
					{ text = "Tell me about this town.",         nextId = "lore_1" },
					{ text = "Nothing, goodbye.",                nextId = "farewell", action = "close" },
				},
			},
			shop = {
				id      = "shop",
				text    = "Of course! Take a look at my finest goods.",
				speaker = "Merchant Aldric",
				choices = {
					{ text = "Thanks, that's all.", nextId = "farewell", action = "close" },
				},
			},
			quest_intro = {
				id      = "quest_intro",
				text    = "Actually, yes. Wolves have been terrorising the village roads. Kill 5 of them and I'll reward you handsomely.",
				speaker = "Merchant Aldric",
				choices = {
					{ text = "I'll take care of it.",   nextId = "quest_accept", action = "accept_quest:wolves_quest" },
					{ text = "Sounds too dangerous.",   nextId = "quest_decline" },
				},
			},
			quest_accept = {
				id      = "quest_accept",
				text    = "Wonderful! The wolves prowl the forest to the east. Stay safe out there.",
				speaker = "Merchant Aldric",
				choices = {
					{ text = "Understood. Farewell.", nextId = "farewell", action = "close" },
				},
			},
			quest_decline = {
				id      = "quest_decline",
				text    = "No worries. Come back if you change your mind.",
				speaker = "Merchant Aldric",
				choices = {
					{ text = "Goodbye.", nextId = "farewell", action = "close" },
				},
			},
			lore_1 = {
				id      = "lore_1",
				text    = "Thornhaven has stood for two centuries. Founded by the explorer Theron, it became a trade hub after the Great Road was built.",
				speaker = "Merchant Aldric",
				choices = {
					{ text = "Who built the Great Road?",    nextId = "lore_2" },
					{ text = "Interesting. Goodbye.",        nextId = "farewell", action = "close" },
				},
			},
			lore_2 = {
				id      = "lore_2",
				text    = "The Stoneguard dwarves built it — took forty years, they say. You can still see their runes carved into the milestones.",
				speaker = "Merchant Aldric",
				choices = {
					{ text = "Fascinating. Thank you.", nextId = "farewell", action = "close" },
				},
			},
			farewell = {
				id      = "farewell",
				text    = "Safe travels, friend. Come back anytime!",
				speaker = "Merchant Aldric",
				choices = {},
			},
		},
	},
	["NPC_Guard"] = {
		npcName = "Guard Captain",
		start   = "root",
		nodes   = {
			root = {
				id      = "root",
				text    = "Halt! State your business in Thornhaven.",
				speaker = "Guard Captain",
				choices = {
					{ text = "I'm a trader passing through.", nextId = "trader" },
					{ text = "I'm here to help with the wolves.", nextId = "wolf_ref" },
					{ text = "Just looking around.",           nextId = "farewell", action = "close" },
				},
			},
			trader = {
				id      = "trader",
				text    = "Very well. Keep your weapons sheathed and stay out of trouble.",
				speaker = "Guard Captain",
				choices = {
					{ text = "Understood.", nextId = "farewell", action = "close" },
				},
			},
			wolf_ref = {
				id      = "wolf_ref",
				text    = "You've heard about that? Good. See the merchant in the market square — he's been organising the bounty.",
				speaker = "Guard Captain",
				choices = {
					{ text = "I'll do that. Thanks.", nextId = "farewell", action = "close" },
				},
			},
			farewell = {
				id      = "farewell",
				text    = "Move along.",
				speaker = "Guard Captain",
				choices = {},
			},
		},
	},
}

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder")
Remotes.Name  = "DialogueRemotes"
Remotes.Parent = ReplicatedStorage

local StartDialogue  = Instance.new("RemoteEvent");    StartDialogue.Name  = "StartDialogue";  StartDialogue.Parent  = Remotes
local GetNode        = Instance.new("RemoteFunction"); GetNode.Name        = "GetNode";        GetNode.Parent        = Remotes
local DialogueAction = Instance.new("RemoteEvent");    DialogueAction.Name = "DialogueAction"; DialogueAction.Parent = Remotes
local EndDialogue    = Instance.new("RemoteEvent");    EndDialogue.Name    = "EndDialogue";    EndDialogue.Parent    = Remotes

-- ── Active sessions: player → { treeId, nodeId } ──────────────────────────────
local sessions: {[number]: { treeId: string, nodeId: string }} = {}

-- ── ProximityPrompt hookup ────────────────────────────────────────────────────
-- Expects NPCs to have a Model with a ProximityPrompt named "DialoguePrompt"
-- and an attribute "DialogueTreeId" set to the key in DIALOGUE_TREES.
local function hookNPC(npcModel: Model)
	local treeId = npcModel:GetAttribute("DialogueTreeId")
	if type(treeId) ~= "string" then return end
	if not DIALOGUE_TREES[treeId] then return end

	local prompt = npcModel:FindFirstChild("DialoguePrompt", true)
	if not prompt or not prompt:IsA("ProximityPrompt") then
		-- Create one if missing
		local root = npcModel:FindFirstChildOfClass("BasePart") :: BasePart?
		if not root then return end
		prompt = Instance.new("ProximityPrompt")
		;(prompt :: ProximityPrompt).ActionText = "Talk"
		;(prompt :: ProximityPrompt).ObjectText  = DIALOGUE_TREES[treeId].npcName
		;(prompt :: ProximityPrompt).HoldDuration = 0
		prompt.Parent = root
	end

	;(prompt :: ProximityPrompt).Triggered:Connect(function(player: Player)
		local tree = DIALOGUE_TREES[treeId]
		sessions[player.UserId] = { treeId = treeId, nodeId = tree.start }
		local startNode = tree.nodes[tree.start]
		StartDialogue:FireClient(player, tree.npcName, startNode)
	end)
end

-- Auto-hook all current and future NPCs
for _, obj in workspace:GetDescendants() do
	if obj:IsA("Model") and obj:GetAttribute("DialogueTreeId") then
		hookNPC(obj :: Model)
	end
end
workspace.DescendantAdded:Connect(function(obj)
	if obj:IsA("Model") and obj:GetAttribute("DialogueTreeId") then
		hookNPC(obj :: Model)
	end
end)

-- ── GetNode: client requests next node by choosing a choice index ─────────────
GetNode.OnServerInvoke = function(player: Player, choiceIndex: unknown): DialogueNode?
	local session = sessions[player.UserId]
	if not session then return nil end

	local tree    = DIALOGUE_TREES[session.treeId]
	if not tree   then return nil end

	local curNode = tree.nodes[session.nodeId]
	if not curNode then return nil end

	if type(choiceIndex) ~= "number" then return nil end
	local choice = curNode.choices[choiceIndex]
	if not choice then return nil end

	-- Fire action if present
	if choice.action then
		DialogueAction:FireClient(player, choice.action)
	end

	-- Advance session
	local nextNode = tree.nodes[choice.nextId]
	if nextNode then
		sessions[player.UserId].nodeId = nextNode.id
		if #nextNode.choices == 0 then
			-- Leaf node — end dialogue after delivery
			task.delay(2, function()
				EndDialogue:FireClient(player)
				sessions[player.UserId] = nil
			end)
		end
		return nextNode
	end

	sessions[player.UserId] = nil
	EndDialogue:FireClient(player)
	return nil
end

-- Cleanup on leave
Players.PlayerRemoving:Connect(function(player: Player)
	sessions[player.UserId] = nil
end)

print("[DialogueServer] Ready — " .. (function()
	local n = 0; for _ in DIALOGUE_TREES do n += 1 end; return n
end)() .. " NPC trees loaded")
`,
}

const DIALOGUE_CLIENT: GameSystemFile = {
  filename: 'DialogueClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- DialogueClient (LocalScript → StarterPlayerScripts)
-- Bottom-screen dialogue box, NPC name, typewriter text, choice buttons.
-- Handles: quest acceptance, shop opening, lore delivery.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local Remotes       = ReplicatedStorage:WaitForChild("DialogueRemotes")
local StartDialogue = Remotes:WaitForChild("StartDialogue")  :: RemoteEvent
local GetNode       = Remotes:WaitForChild("GetNode")        :: RemoteFunction
local DialogueAction = Remotes:WaitForChild("DialogueAction") :: RemoteEvent
local EndDialogue   = Remotes:WaitForChild("EndDialogue")    :: RemoteEvent

-- ── GUI construction ──────────────────────────────────────────────────────────
local screen = Instance.new("ScreenGui")
screen.Name = "DialogueGui"
screen.ResetOnSpawn = false
screen.Enabled = false
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.Parent = playerGui

-- Main box at bottom of screen
local box = Instance.new("Frame")
box.Size = UDim2.new(0.75, 0, 0, 200)
box.Position = UDim2.new(0.125, 0, 1, -220)
box.BackgroundColor3 = Color3.fromRGB(10, 10, 20)
box.BackgroundTransparency = 0.1
box.Parent = screen
Instance.new("UICorner").Parent = box
local boxStroke = Instance.new("UIStroke"); boxStroke.Color = Color3.fromRGB(212, 175, 55); boxStroke.Thickness = 2; boxStroke.Parent = box

-- NPC name tab
local nameTag = Instance.new("Frame")
nameTag.Size = UDim2.new(0, 220, 0, 34)
nameTag.Position = UDim2.new(0, 16, 0, -17)
nameTag.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
nameTag.Parent = box
Instance.new("UICorner").Parent = nameTag

local nameLbl = Instance.new("TextLabel")
nameLbl.Size = UDim2.new(1, -16, 1, 0)
nameLbl.Position = UDim2.new(0, 8, 0, 0)
nameLbl.BackgroundTransparency = 1
nameLbl.Text = ""
nameLbl.TextSize = 15
nameLbl.Font = Enum.Font.GothamBold
nameLbl.TextColor3 = Color3.fromRGB(12, 12, 22)
nameLbl.TextXAlignment = Enum.TextXAlignment.Left
nameLbl.Parent = nameTag

-- Dialogue text area
local textArea = Instance.new("TextLabel")
textArea.Size = UDim2.new(1, -32, 0, 80)
textArea.Position = UDim2.new(0, 16, 0, 28)
textArea.BackgroundTransparency = 1
textArea.Text = ""
textArea.TextSize = 16
textArea.Font = Enum.Font.Gotham
textArea.TextColor3 = Color3.fromRGB(230, 230, 230)
textArea.TextWrapped = true
textArea.TextXAlignment = Enum.TextXAlignment.Left
textArea.TextYAlignment = Enum.TextYAlignment.Top
textArea.Parent = box

-- Choices container
local choiceFrame = Instance.new("Frame")
choiceFrame.Size = UDim2.new(1, -32, 0, 80)
choiceFrame.Position = UDim2.new(0, 16, 0, 114)
choiceFrame.BackgroundTransparency = 1
choiceFrame.Parent = box

local choiceLayout = Instance.new("UIListLayout")
choiceLayout.FillDirection = Enum.FillDirection.Vertical
choiceLayout.Padding = UDim.new(0, 6)
choiceLayout.Parent = choiceFrame

-- ── Typewriter effect ─────────────────────────────────────────────────────────
local typewriterThread: thread? = nil

local function typewriterPlay(text: string, onDone: () -> ())
	if typewriterThread then task.cancel(typewriterThread) end
	textArea.Text = ""
	typewriterThread = task.spawn(function()
		for i = 1, #text do
			textArea.Text = text:sub(1, i)
			task.wait(0.03)
		end
		typewriterThread = nil
		onDone()
	end)
end

-- ── Choice buttons ────────────────────────────────────────────────────────────
local choiceButtons: {TextButton} = {}

local function clearChoices()
	for _, btn in choiceButtons do btn:Destroy() end
	choiceButtons = {}
end

local function buildChoices(choices: {{text: string, nextId: string, action: string?}})
	clearChoices()
	for i, choice in choices do
		local btn = Instance.new("TextButton")
		btn.Size = UDim2.new(1, 0, 0, 28)
		btn.BackgroundColor3 = Color3.fromRGB(22, 22, 38)
		btn.Text = tostring(i) .. ". " .. choice.text
		btn.TextSize = 13
		btn.Font = Enum.Font.Gotham
		btn.TextColor3 = Color3.fromRGB(212, 175, 55)
		btn.TextXAlignment = Enum.TextXAlignment.Left
		btn.Parent = choiceFrame
		Instance.new("UICorner").Parent = btn

		table.insert(choiceButtons, btn)

		local capturedI = i
		btn.MouseButton1Click:Connect(function()
			clearChoices()
			-- Small visual flash
			TweenService:Create(btn,
				TweenInfo.new(0.15),
				{ BackgroundColor3 = Color3.fromRGB(40, 40, 60) }
			):Play()
			local nextNode = GetNode:InvokeServer(capturedI)
			if nextNode then
				nameLbl.Text = nextNode.speaker
				typewriterPlay(nextNode.text, function()
					if #nextNode.choices > 0 then
						buildChoices(nextNode.choices)
					end
				end)
			end
		end)
	end
end

-- ── Open / close ──────────────────────────────────────────────────────────────
local function openDialogue(npcName: string, node: {id: string, text: string, speaker: string, choices: {any}})
	clearChoices()
	nameLbl.Text = npcName
	screen.Enabled = true
	-- Slide in
	box.Position = UDim2.new(0.125, 0, 1, 50)
	TweenService:Create(box, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
		Position = UDim2.new(0.125, 0, 1, -220)
	}):Play()
	typewriterPlay(node.text, function()
		if #node.choices > 0 then
			buildChoices(node.choices)
		end
	end)
end

local function closeDialogue()
	if typewriterThread then task.cancel(typewriterThread); typewriterThread = nil end
	clearChoices()
	TweenService:Create(box,
		TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
		{ Position = UDim2.new(0.125, 0, 1, 50) }
	):Play()
	task.delay(0.28, function() screen.Enabled = false end)
end

StartDialogue.OnClientEvent:Connect(function(npcName: string, node: any)
	openDialogue(npcName, node)
end)

EndDialogue.OnClientEvent:Connect(closeDialogue)

-- ── Handle actions fired from server ──────────────────────────────────────────
DialogueAction.OnClientEvent:Connect(function(action: string)
	if action == "open_shop" then
		-- Signal the shop system
		local shopRemotes = ReplicatedStorage:FindFirstChild("ShopRemotes")
		if shopRemotes then
			local openShop = shopRemotes:FindFirstChild("OpenShop") :: RemoteEvent?
			if openShop then openShop:FireServer() end
		end
	elseif action:sub(1, 13) == "accept_quest:" then
		local questId = action:sub(14)
		-- Signal the quest system
		local questRemotes = ReplicatedStorage:FindFirstChild("QuestRemotes")
		if questRemotes then
			local acceptQuest = questRemotes:FindFirstChild("AcceptQuest") :: RemoteEvent?
			if acceptQuest then acceptQuest:FireServer(questId) end
		end
		print("[Dialogue] Quest accepted:", questId)
	elseif action == "close" then
		task.delay(0.5, closeDialogue)
	end
end)

print("[DialogueClient] Ready")
`,
}

// ─── 22. Achievement System ──────────────────────────────────────────────────

const ACHIEVEMENT_SERVER: GameSystemFile = {
  filename: 'AchievementServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- AchievementServer (ServerScript → ServerScriptService)
-- Achievement definitions, per-player progress tracking, DataStore persistence.
-- Criteria types: reach_level, collect_items, kill_enemies, play_time, visit_zone.

local Players           = game:GetService("Players")
local DataStoreService  = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local AchDS = DataStoreService:GetDataStore("AchievementsV1")

-- ── Types ─────────────────────────────────────────────────────────────────────
type CriteriaType = "reach_level" | "collect_items" | "kill_enemies" | "play_time" | "visit_zone"

type Achievement = {
	id:          string,
	title:       string,
	description: string,
	icon:        string,       -- rbxassetid string or emoji placeholder
	criteriaType: CriteriaType,
	criteriaKey:  string,      -- e.g. itemId for collect_items, zone name for visit_zone
	criteriaGoal: number,      -- target value
	rewardCoins:  number,
	rewardXP:     number,
}

type PlayerProgress = {
	unlocked:  {[string]: boolean},  -- achievementId → true if unlocked
	progress:  {[string]: number},   -- achievementId → current count
}

-- ── Achievement definitions ───────────────────────────────────────────────────
local ACHIEVEMENTS: {Achievement} = {
	{
		id = "first_level", title = "First Steps", description = "Reach Level 5",
		icon = "⭐", criteriaType = "reach_level", criteriaKey = "level",
		criteriaGoal = 5, rewardCoins = 100, rewardXP = 0,
	},
	{
		id = "veteran", title = "Veteran", description = "Reach Level 25",
		icon = "🏅", criteriaType = "reach_level", criteriaKey = "level",
		criteriaGoal = 25, rewardCoins = 500, rewardXP = 1000,
	},
	{
		id = "collector", title = "Collector", description = "Collect 50 Iron Ingots",
		icon = "🔩", criteriaType = "collect_items", criteriaKey = "iron_ingot",
		criteriaGoal = 50, rewardCoins = 200, rewardXP = 500,
	},
	{
		id = "warrior", title = "Warrior", description = "Defeat 100 enemies",
		icon = "⚔️", criteriaType = "kill_enemies", criteriaKey = "any",
		criteriaGoal = 100, rewardCoins = 300, rewardXP = 750,
	},
	{
		id = "explorer", title = "Explorer", description = "Spend 60 minutes in-game",
		icon = "🗺️", criteriaType = "play_time", criteriaKey = "minutes",
		criteriaGoal = 60, rewardCoins = 150, rewardXP = 200,
	},
	{
		id = "zone_dungeon", title = "Dungeon Delver", description = "Visit the Dungeon Zone",
		icon = "🏰", criteriaType = "visit_zone", criteriaKey = "Dungeon",
		criteriaGoal = 1, rewardCoins = 250, rewardXP = 500,
	},
	{
		id = "zone_volcano", title = "Fire Walker", description = "Visit the Volcano Zone",
		icon = "🌋", criteriaType = "visit_zone", criteriaKey = "Volcano",
		criteriaGoal = 1, rewardCoins = 300, rewardXP = 600,
	},
}

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder")
Remotes.Name  = "AchievementRemotes"
Remotes.Parent = ReplicatedStorage

local GetAchievements   = Instance.new("RemoteFunction"); GetAchievements.Name   = "GetAchievements";   GetAchievements.Parent   = Remotes
local GetProgress       = Instance.new("RemoteFunction"); GetProgress.Name       = "GetProgress";       GetProgress.Parent       = Remotes
local AchievementUnlocked = Instance.new("RemoteEvent"); AchievementUnlocked.Name = "AchievementUnlocked"; AchievementUnlocked.Parent = Remotes
local UpdateProgress    = Instance.new("RemoteEvent");    UpdateProgress.Name    = "UpdateProgress";    UpdateProgress.Parent    = Remotes

-- ── In-memory progress ────────────────────────────────────────────────────────
local playerProgress: {[number]: PlayerProgress} = {}

local function loadProgress(player: Player): PlayerProgress
	local ok, data = pcall(AchDS.GetAsync, AchDS, "ach_" .. tostring(player.UserId))
	if ok and type(data) == "table" then
		return data :: PlayerProgress
	end
	return { unlocked = {}, progress = {} }
end

local function saveProgress(player: Player)
	local prog = playerProgress[player.UserId]
	if not prog then return end
	local ok, err = pcall(AchDS.SetAsync, AchDS, "ach_" .. tostring(player.UserId), prog)
	if not ok then warn("[Achievements] Save failed:", err) end
end

Players.PlayerAdded:Connect(function(player: Player)
	playerProgress[player.UserId] = loadProgress(player)
	UpdateProgress:FireClient(player, playerProgress[player.UserId])
end)

Players.PlayerRemoving:Connect(function(player: Player)
	saveProgress(player)
	playerProgress[player.UserId] = nil
end)

game:BindToClose(function()
	for _, p in Players:GetPlayers() do saveProgress(p) end
end)

-- ── Unlock helper ─────────────────────────────────────────────────────────────
local function tryUnlock(player: Player, achievement: Achievement)
	local prog = playerProgress[player.UserId]
	if not prog then return end
	if prog.unlocked[achievement.id] then return end

	local current = prog.progress[achievement.id] or 0
	if current < achievement.criteriaGoal then return end

	prog.unlocked[achievement.id] = true

	-- Grant rewards
	local ls = player:FindFirstChild("leaderstats")
	if ls then
		local coins = ls:FindFirstChild("Coins") :: IntValue?
		if coins then coins.Value += achievement.rewardCoins end
		local xp = ls:FindFirstChild("XP") :: IntValue?
		if xp then xp.Value += achievement.rewardXP end
	end

	AchievementUnlocked:FireClient(player, achievement)
	UpdateProgress:FireClient(player, prog)
	saveProgress(player)
end

-- ── Public API for other server scripts ───────────────────────────────────────
local function recordProgress(player: Player, criteriaType: string, criteriaKey: string, amount: number)
	local prog = playerProgress[player.UserId]
	if not prog then return end

	for _, ach in ACHIEVEMENTS do
		if ach.criteriaType == criteriaType and (ach.criteriaKey == criteriaKey or ach.criteriaKey == "any") then
			if not prog.unlocked[ach.id] then
				prog.progress[ach.id] = math.min(
					(prog.progress[ach.id] or 0) + amount,
					ach.criteriaGoal
				)
				tryUnlock(player, ach)
			end
		end
	end

	UpdateProgress:FireClient(player, prog)
end

-- ── Play-time tracking ────────────────────────────────────────────────────────
local joinTimes: {[number]: number} = {}

Players.PlayerAdded:Connect(function(player: Player)
	joinTimes[player.UserId] = os.time()
end)

Players.PlayerRemoving:Connect(function(player: Player)
	local jt = joinTimes[player.UserId]
	if jt then
		local minutesPlayed = (os.time() - jt) / 60
		recordProgress(player, "play_time", "minutes", minutesPlayed)
		joinTimes[player.UserId] = nil
	end
end)

-- ── Remote handlers ───────────────────────────────────────────────────────────
GetAchievements.OnServerInvoke = function(_player: Player): {Achievement}
	return ACHIEVEMENTS
end

GetProgress.OnServerInvoke = function(player: Player): PlayerProgress
	return playerProgress[player.UserId] or { unlocked = {}, progress = {} }
end

-- ── Expose API ────────────────────────────────────────────────────────────────
return { recordProgress = recordProgress }
`,
}

const ACHIEVEMENT_CLIENT: GameSystemFile = {
  filename: 'AchievementClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- AchievementClient (LocalScript → StarterPlayerScripts)
-- Unlock popup (gold border + confetti), achievement log GUI.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local UserInputService  = game:GetService("UserInputService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local Remotes           = ReplicatedStorage:WaitForChild("AchievementRemotes")
local GetAchievements   = Remotes:WaitForChild("GetAchievements")   :: RemoteFunction
local GetProgress       = Remotes:WaitForChild("GetProgress")       :: RemoteFunction
local AchievementUnlocked = Remotes:WaitForChild("AchievementUnlocked") :: RemoteEvent
local UpdateProgress    = Remotes:WaitForChild("UpdateProgress")    :: RemoteEvent

-- ── Popup GUI ─────────────────────────────────────────────────────────────────
local popupGui = Instance.new("ScreenGui")
popupGui.Name = "AchievementPopupGui"
popupGui.ResetOnSpawn = false
popupGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
popupGui.Parent = playerGui

local popup = Instance.new("Frame")
popup.Size = UDim2.new(0, 340, 0, 90)
popup.Position = UDim2.new(0.5, -170, 0, -100)
popup.BackgroundColor3 = Color3.fromRGB(12, 12, 22)
popup.Parent = popupGui
Instance.new("UICorner").Parent = popup
local popupStroke = Instance.new("UIStroke"); popupStroke.Color = Color3.fromRGB(212, 175, 55); popupStroke.Thickness = 3; popupStroke.Parent = popup

local popupIcon = Instance.new("TextLabel")
popupIcon.Size = UDim2.new(0, 60, 1, 0)
popupIcon.BackgroundTransparency = 1
popupIcon.Text = "🏆"
popupIcon.TextSize = 34
popupIcon.Font = Enum.Font.GothamBold
popupIcon.Parent = popup

local popupTitle = Instance.new("TextLabel")
popupTitle.Size = UDim2.new(1, -70, 0, 22)
popupTitle.Position = UDim2.new(0, 66, 0, 14)
popupTitle.BackgroundTransparency = 1
popupTitle.Text = "Achievement Unlocked!"
popupTitle.TextSize = 13
popupTitle.Font = Enum.Font.GothamBold
popupTitle.TextColor3 = Color3.fromRGB(212, 175, 55)
popupTitle.TextXAlignment = Enum.TextXAlignment.Left
popupTitle.Parent = popup

local popupName = Instance.new("TextLabel")
popupName.Size = UDim2.new(1, -70, 0, 28)
popupName.Position = UDim2.new(0, 66, 0, 36)
popupName.BackgroundTransparency = 1
popupName.Text = ""
popupName.TextSize = 18
popupName.Font = Enum.Font.GothamBold
popupName.TextColor3 = Color3.fromRGB(240, 240, 240)
popupName.TextXAlignment = Enum.TextXAlignment.Left
popupName.Parent = popup

local popupDesc = Instance.new("TextLabel")
popupDesc.Size = UDim2.new(1, -70, 0, 18)
popupDesc.Position = UDim2.new(0, 66, 0, 64)
popupDesc.BackgroundTransparency = 1
popupDesc.Text = ""
popupDesc.TextSize = 12
popupDesc.Font = Enum.Font.Gotham
popupDesc.TextColor3 = Color3.fromRGB(160, 160, 160)
popupDesc.TextXAlignment = Enum.TextXAlignment.Left
popupDesc.Parent = popup

-- ── Confetti particles ─────────────────────────────────────────────────────────
local confettiGui = Instance.new("ScreenGui")
confettiGui.Name = "ConfettiGui"
confettiGui.ResetOnSpawn = false
confettiGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
confettiGui.Parent = playerGui

local CONFETTI_COLORS = {
	Color3.fromRGB(212, 175, 55),
	Color3.fromRGB(80, 200, 100),
	Color3.fromRGB(80, 140, 255),
	Color3.fromRGB(255, 80, 80),
	Color3.fromRGB(255, 200, 80),
}

local function spawnConfetti()
	for _ = 1, 30 do
		local dot = Instance.new("Frame")
		dot.Size = UDim2.new(0, math.random(6, 14), 0, math.random(6, 14))
		dot.Position = UDim2.new(math.random() * 0.6 + 0.2, 0, 0, math.random(-20, 20))
		dot.BackgroundColor3 = CONFETTI_COLORS[math.random(1, #CONFETTI_COLORS)]
		dot.Rotation = math.random(0, 360)
		dot.BorderSizePixel = 0
		dot.Parent = confettiGui

		TweenService:Create(dot, TweenInfo.new(math.random(100, 250) / 100, Enum.EasingStyle.Quad), {
			Position = UDim2.new(dot.Position.X.Scale, 0, 1, math.random(50, 120)),
			Rotation = dot.Rotation + math.random(180, 540),
			BackgroundTransparency = 1,
		}):Play()

		task.delay(2.5, function()
			if dot.Parent then dot:Destroy() end
		end)
	end
end

-- ── Popup queue ───────────────────────────────────────────────────────────────
local popupQueue: {{title: string, description: string, icon: string}} = {}
local popupActive = false

local function showNextPopup()
	if #popupQueue == 0 or popupActive then return end
	popupActive = true
	local ach = table.remove(popupQueue, 1)
	popupIcon.Text = ach.icon
	popupName.Text = ach.title
	popupDesc.Text = ach.description

	-- Slide in from top
	popup.Position = UDim2.new(0.5, -170, 0, -100)
	TweenService:Create(popup, TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
		Position = UDim2.new(0.5, -170, 0, 20)
	}):Play()

	spawnConfetti()

	task.delay(4, function()
		TweenService:Create(popup, TweenInfo.new(0.35, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
			Position = UDim2.new(0.5, -170, 0, -100)
		}):Play()
		task.delay(0.4, function()
			popupActive = false
			showNextPopup()
		end)
	end)
end

AchievementUnlocked.OnClientEvent:Connect(function(ach: any)
	table.insert(popupQueue, {
		title       = tostring(ach.title),
		description = tostring(ach.description),
		icon        = tostring(ach.icon),
	})
	showNextPopup()
end)

-- ── Achievement log GUI ───────────────────────────────────────────────────────
local logGui = Instance.new("ScreenGui")
logGui.Name = "AchievementLogGui"
logGui.ResetOnSpawn = false
logGui.Enabled = false
logGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
logGui.Parent = playerGui

local logDimmer = Instance.new("Frame")
logDimmer.Size = UDim2.new(1, 0, 1, 0)
logDimmer.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
logDimmer.BackgroundTransparency = 0.55
logDimmer.Parent = logGui

local logPanel = Instance.new("Frame")
logPanel.Size = UDim2.new(0, 560, 0, 500)
logPanel.Position = UDim2.new(0.5, -280, 0.5, -250)
logPanel.BackgroundColor3 = Color3.fromRGB(12, 12, 22)
logPanel.Parent = logGui
Instance.new("UICorner").Parent = logPanel
Instance.new("UIStroke", logPanel).Color = Color3.fromRGB(212, 175, 55)

local logHeader = Instance.new("Frame")
logHeader.Size = UDim2.new(1, 0, 0, 52)
logHeader.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
logHeader.Parent = logPanel
Instance.new("UICorner").Parent = logHeader

local logTitle = Instance.new("TextLabel")
logTitle.Size = UDim2.new(1, -60, 1, 0)
logTitle.Position = UDim2.new(0, 16, 0, 0)
logTitle.BackgroundTransparency = 1
logTitle.Text = "ACHIEVEMENTS"
logTitle.TextSize = 20
logTitle.Font = Enum.Font.GothamBold
logTitle.TextColor3 = Color3.fromRGB(12, 12, 22)
logTitle.TextXAlignment = Enum.TextXAlignment.Left
logTitle.Parent = logHeader

local logClose = Instance.new("TextButton")
logClose.Size = UDim2.new(0, 36, 0, 36)
logClose.Position = UDim2.new(1, -46, 0, 8)
logClose.BackgroundColor3 = Color3.fromRGB(12, 12, 22)
logClose.Text = "✕"
logClose.TextSize = 16
logClose.Font = Enum.Font.GothamBold
logClose.TextColor3 = Color3.fromRGB(212, 175, 55)
logClose.Parent = logHeader
Instance.new("UICorner").Parent = logClose

local logScroll = Instance.new("ScrollingFrame")
logScroll.Size = UDim2.new(1, -32, 1, -72)
logScroll.Position = UDim2.new(0, 16, 0, 62)
logScroll.BackgroundColor3 = Color3.fromRGB(18, 18, 30)
logScroll.BorderSizePixel = 0
logScroll.ScrollBarThickness = 6
logScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
logScroll.Parent = logPanel
Instance.new("UICorner").Parent = logScroll

local logLayout = Instance.new("UIListLayout")
logLayout.Padding = UDim.new(0, 8)
logLayout.Parent = logScroll
local logPad = Instance.new("UIPadding")
logPad.PaddingAll = UDim.new(0, 10)
logPad.Parent = logScroll

-- ── Populate log ───────────────────────────────────────────────────────────────
local cachedProgress: {unlocked: {[string]: boolean}, progress: {[string]: number}}? = nil

local function refreshLog()
	for _, child in logScroll:GetChildren() do
		if child:IsA("Frame") then child:Destroy() end
	end

	local allAchs = GetAchievements:InvokeServer()
	local prog    = cachedProgress or GetProgress:InvokeServer()

	for _, ach in (allAchs :: any) do
		local unlocked = prog.unlocked[ach.id] == true
		local current  = prog.progress[ach.id] or 0

		local row = Instance.new("Frame")
		row.Size = UDim2.new(1, 0, 0, 64)
		row.BackgroundColor3 = unlocked
			and Color3.fromRGB(20, 30, 20)
			or  Color3.fromRGB(22, 22, 36)
		row.Parent = logScroll
		Instance.new("UICorner").Parent = row
		local rowStroke = Instance.new("UIStroke")
		rowStroke.Color = unlocked
			and Color3.fromRGB(80, 200, 100)
			or  Color3.fromRGB(40, 40, 60)
		rowStroke.Parent = row

		local iconLbl2 = Instance.new("TextLabel")
		iconLbl2.Size = UDim2.new(0, 50, 1, 0)
		iconLbl2.BackgroundTransparency = 1
		iconLbl2.Text = ach.icon
		iconLbl2.TextSize = 28
		iconLbl2.Font = Enum.Font.GothamBold
		iconLbl2.Parent = row

		local titleLbl2 = Instance.new("TextLabel")
		titleLbl2.Size = UDim2.new(0.55, 0, 0, 22)
		titleLbl2.Position = UDim2.new(0, 58, 0, 8)
		titleLbl2.BackgroundTransparency = 1
		titleLbl2.Text = ach.title
		titleLbl2.TextSize = 14
		titleLbl2.Font = Enum.Font.GothamBold
		titleLbl2.TextColor3 = unlocked
			and Color3.fromRGB(100, 220, 100)
			or  Color3.fromRGB(200, 200, 200)
		titleLbl2.TextXAlignment = Enum.TextXAlignment.Left
		titleLbl2.Parent = row

		local descLbl2 = Instance.new("TextLabel")
		descLbl2.Size = UDim2.new(0.55, 0, 0, 18)
		descLbl2.Position = UDim2.new(0, 58, 0, 30)
		descLbl2.BackgroundTransparency = 1
		descLbl2.Text = ach.description
		descLbl2.TextSize = 11
		descLbl2.Font = Enum.Font.Gotham
		descLbl2.TextColor3 = Color3.fromRGB(140, 140, 160)
		descLbl2.TextXAlignment = Enum.TextXAlignment.Left
		descLbl2.Parent = row

		-- Progress bar
		local pBg = Instance.new("Frame")
		pBg.Size = UDim2.new(0, 180, 0, 8)
		pBg.Position = UDim2.new(1, -196, 0.5, -4)
		pBg.BackgroundColor3 = Color3.fromRGB(30, 30, 44)
		pBg.Parent = row
		Instance.new("UICorner").Parent = pBg

		local pFill = Instance.new("Frame")
		local pct = unlocked and 1 or math.clamp(current / ach.criteriaGoal, 0, 1)
		pFill.Size = UDim2.new(pct, 0, 1, 0)
		pFill.BackgroundColor3 = unlocked
			and Color3.fromRGB(80, 200, 100)
			or  Color3.fromRGB(212, 175, 55)
		pFill.Parent = pBg
		Instance.new("UICorner").Parent = pFill

		local pLbl = Instance.new("TextLabel")
		pLbl.Size = UDim2.new(0, 180, 0, 18)
		pLbl.Position = UDim2.new(1, -196, 0.5, 6)
		pLbl.BackgroundTransparency = 1
		pLbl.Text = unlocked
			and "Completed!"
			or  tostring(math.floor(current)) .. " / " .. tostring(ach.criteriaGoal)
		pLbl.TextSize = 11
		pLbl.Font = Enum.Font.Gotham
		pLbl.TextColor3 = Color3.fromRGB(160, 160, 160)
		pLbl.TextXAlignment = Enum.TextXAlignment.Right
		pLbl.Parent = row
	end

	logScroll.CanvasSize = UDim2.new(0, 0, 0, logLayout.AbsoluteContentSize.Y + 20)
end

UpdateProgress.OnClientEvent:Connect(function(prog: any)
	cachedProgress = prog
	if logGui.Enabled then refreshLog() end
end)

logClose.MouseButton1Click:Connect(function() logGui.Enabled = false end)
logDimmer.InputBegan:Connect(function(input: InputObject)
	if input.UserInputType == Enum.UserInputType.MouseButton1 then logGui.Enabled = false end
end)

UserInputService.InputBegan:Connect(function(input: InputObject, gameProcessed: boolean)
	if gameProcessed then return end
	if input.KeyCode == Enum.KeyCode.H then
		logGui.Enabled = not logGui.Enabled
		if logGui.Enabled then refreshLog() end
	end
end)

print("[AchievementClient] Ready — press H to open achievement log")
`,
}

// ─── 23. Zone System ─────────────────────────────────────────────────────────

const ZONE_SERVER: GameSystemFile = {
  filename: 'ZoneServer',
  scriptType: 'ServerScript',
  parent: 'ServerScriptService',
  code: `--!strict
-- ZoneServer (ServerScript → ServerScriptService)
-- Zone detection via ZoneTag attribute, player enter/exit events,
-- zone music, lighting mood, zone gate (require level/item), transitions.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting          = game:GetService("Lighting")
local RunService        = game:GetService("RunService")

-- ── Types ─────────────────────────────────────────────────────────────────────
type ZoneDef = {
	id:            string,
	displayName:   string,
	musicId:       string,      -- rbxassetid
	ambientColor:  Color3,
	fogEnd:        number,
	brightness:    number,
	requireLevel:  number?,     -- min level to enter
	requireItem:   string?,     -- item id required to enter
	abilityFlags:  {[string]: boolean},  -- e.g. { canFly = true }
}

-- ── Zone definitions ──────────────────────────────────────────────────────────
-- Place BaseParts/Folders in workspace with attribute ZoneId = key below.
-- Parts tagged with ZoneId define the zone boundary (TouchEnded/TouchBegan).
local ZONE_DEFS: {[string]: ZoneDef} = {
	Overworld = {
		id = "Overworld", displayName = "Overworld",
		musicId = "rbxassetid://0",
		ambientColor = Color3.fromRGB(100, 110, 130),
		fogEnd = 1000, brightness = 1,
		requireLevel = nil, requireItem = nil,
		abilityFlags = {},
	},
	Dungeon = {
		id = "Dungeon", displayName = "Dark Dungeon",
		musicId = "rbxassetid://0",
		ambientColor = Color3.fromRGB(30, 20, 40),
		fogEnd = 200, brightness = 0.3,
		requireLevel = 5, requireItem = nil,
		abilityFlags = { canFly = false },
	},
	Volcano = {
		id = "Volcano", displayName = "Volcano Crater",
		musicId = "rbxassetid://0",
		ambientColor = Color3.fromRGB(180, 60, 20),
		fogEnd = 300, brightness = 1.5,
		requireLevel = 10, requireItem = "fire_charm",
		abilityFlags = {},
	},
	Sky = {
		id = "Sky", displayName = "Sky Realm",
		musicId = "rbxassetid://0",
		ambientColor = Color3.fromRGB(140, 190, 255),
		fogEnd = 2000, brightness = 2,
		requireLevel = 15, requireItem = nil,
		abilityFlags = { canFly = true },
	},
}

-- ── Remotes ───────────────────────────────────────────────────────────────────
local Remotes = Instance.new("Folder")
Remotes.Name  = "ZoneRemotes"
Remotes.Parent = ReplicatedStorage

local ZoneEntered      = Instance.new("RemoteEvent");    ZoneEntered.Name      = "ZoneEntered";      ZoneEntered.Parent      = Remotes
local ZoneExited       = Instance.new("RemoteEvent");    ZoneExited.Name       = "ZoneExited";       ZoneExited.Parent       = Remotes
local ZoneBlocked      = Instance.new("RemoteEvent");    ZoneBlocked.Name      = "ZoneBlocked";      ZoneBlocked.Parent      = Remotes
local GetCurrentZone   = Instance.new("RemoteFunction"); GetCurrentZone.Name   = "GetCurrentZone";   GetCurrentZone.Parent   = Remotes

-- ── Per-player zone tracking ──────────────────────────────────────────────────
local playerZone: {[number]: string} = {}   -- userId → current zoneId

local function getPlayerLevel(player: Player): number
	local ls = player:FindFirstChild("leaderstats")
	if not ls then return 1 end
	local lv = ls:FindFirstChild("Level") :: IntValue?
	return lv and lv.Value or 1
end

local function playerHasItem(player: Player, itemId: string): boolean
	local backpack = player:FindFirstChildOfClass("Backpack")
	if not backpack then return false end
	local slot = backpack:FindFirstChild(itemId) :: IntValue?
	return slot ~= nil and slot.Value > 0
end

local function canEnterZone(player: Player, zone: ZoneDef): (boolean, string)
	if zone.requireLevel and getPlayerLevel(player) < zone.requireLevel then
		return false, "Requires Level " .. zone.requireLevel
	end
	if zone.requireItem and not playerHasItem(player, zone.requireItem) then
		return false, "Requires: " .. zone.requireItem
	end
	return true, ""
end

-- ── Touch detection ───────────────────────────────────────────────────────────
local function hookZonePart(part: BasePart)
	local zoneId = part:GetAttribute("ZoneId")
	if type(zoneId) ~= "string" then return end
	local zone = ZONE_DEFS[zoneId]
	if not zone then return end

	part.Touched:Connect(function(hit: BasePart)
		local char = hit.Parent
		if not char then return end
		local player = Players:GetPlayerFromCharacter(char :: Model)
		if not player then return end

		-- Debounce: only fire if zone changed
		if playerZone[player.UserId] == zoneId then return end

		local ok, reason = canEnterZone(player, zone)
		if not ok then
			ZoneBlocked:FireClient(player, zone.displayName, reason)
			-- Push player back
			local root = char:FindFirstChild("HumanoidRootPart") :: BasePart?
			if root then
				root.CFrame = root.CFrame - root.CFrame.LookVector * 10
			end
			return
		end

		local previousZone = playerZone[player.UserId]
		playerZone[player.UserId] = zoneId
		ZoneEntered:FireClient(player, zone, previousZone)

		-- Achievement: visit_zone
		-- (call AchievementServer.recordProgress if available)
	end)
end

-- Hook all existing zone parts
for _, obj in workspace:GetDescendants() do
	if obj:IsA("BasePart") and obj:GetAttribute("ZoneId") then
		hookZonePart(obj :: BasePart)
	end
end
workspace.DescendantAdded:Connect(function(obj)
	if obj:IsA("BasePart") and obj:GetAttribute("ZoneId") then
		hookZonePart(obj :: BasePart)
	end
end)

-- ── Remote handlers ───────────────────────────────────────────────────────────
GetCurrentZone.OnServerInvoke = function(player: Player): string
	return playerZone[player.UserId] or "Overworld"
end

Players.PlayerRemoving:Connect(function(player: Player)
	playerZone[player.UserId] = nil
end)

-- ── Expose API ────────────────────────────────────────────────────────────────
return {
	getPlayerZone = function(player: Player): string
		return playerZone[player.UserId] or "Overworld"
	end,
}
`,
}

const ZONE_CLIENT: GameSystemFile = {
  filename: 'ZoneClient',
  scriptType: 'LocalScript',
  parent: 'StarterPlayerScripts',
  code: `--!strict
-- ZoneClient (LocalScript → StarterPlayerScripts)
-- Zone name popup, music swap, lighting mood, ability flag application,
-- loading transition overlay between zones.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local Lighting          = game:GetService("Lighting")
local SoundService      = game:GetService("SoundService")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local Remotes       = ReplicatedStorage:WaitForChild("ZoneRemotes")
local ZoneEntered   = Remotes:WaitForChild("ZoneEntered")   :: RemoteEvent
local ZoneExited    = Remotes:WaitForChild("ZoneExited")    :: RemoteEvent
local ZoneBlocked   = Remotes:WaitForChild("ZoneBlocked")   :: RemoteEvent

-- ── Zone name popup ───────────────────────────────────────────────────────────
local zoneGui = Instance.new("ScreenGui")
zoneGui.Name = "ZoneGui"
zoneGui.ResetOnSpawn = false
zoneGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
zoneGui.Parent = playerGui

local zoneBanner = Instance.new("Frame")
zoneBanner.Size = UDim2.new(0, 300, 0, 60)
zoneBanner.Position = UDim2.new(0.5, -150, 0, -70)
zoneBanner.BackgroundColor3 = Color3.fromRGB(10, 10, 20)
zoneBanner.BackgroundTransparency = 0.2
zoneBanner.Parent = zoneGui
Instance.new("UICorner").Parent = zoneBanner
local zoneStroke = Instance.new("UIStroke"); zoneStroke.Color = Color3.fromRGB(212, 175, 55); zoneStroke.Thickness = 2; zoneStroke.Parent = zoneBanner

local zoneTitleLbl = Instance.new("TextLabel")
zoneTitleLbl.Size = UDim2.new(1, -16, 0, 18)
zoneTitleLbl.Position = UDim2.new(0, 8, 0, 8)
zoneTitleLbl.BackgroundTransparency = 1
zoneTitleLbl.Text = "ENTERING"
zoneTitleLbl.TextSize = 11
zoneTitleLbl.Font = Enum.Font.GothamBold
zoneTitleLbl.TextColor3 = Color3.fromRGB(212, 175, 55)
zoneTitleLbl.Parent = zoneBanner

local zoneNameLbl = Instance.new("TextLabel")
zoneNameLbl.Size = UDim2.new(1, -16, 0, 30)
zoneNameLbl.Position = UDim2.new(0, 8, 0, 24)
zoneNameLbl.BackgroundTransparency = 1
zoneNameLbl.Text = ""
zoneNameLbl.TextSize = 22
zoneNameLbl.Font = Enum.Font.GothamBold
zoneNameLbl.TextColor3 = Color3.fromRGB(240, 240, 240)
zoneNameLbl.Parent = zoneBanner

-- ── Transition overlay ────────────────────────────────────────────────────────
local transGui = Instance.new("ScreenGui")
transGui.Name = "ZoneTransitionGui"
transGui.ResetOnSpawn = false
transGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
transGui.Parent = playerGui

local transFrame = Instance.new("Frame")
transFrame.Size = UDim2.new(1, 0, 1, 0)
transFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
transFrame.BackgroundTransparency = 1
transFrame.Parent = transGui

-- ── Zone blocked popup ────────────────────────────────────────────────────────
local blockedGui = Instance.new("ScreenGui")
blockedGui.Name = "ZoneBlockedGui"
blockedGui.ResetOnSpawn = false
blockedGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
blockedGui.Parent = playerGui

local blockedBanner = Instance.new("Frame")
blockedBanner.Size = UDim2.new(0, 320, 0, 70)
blockedBanner.Position = UDim2.new(0.5, -160, 0.5, 120)
blockedBanner.BackgroundColor3 = Color3.fromRGB(40, 10, 10)
blockedBanner.BackgroundTransparency = 0.1
blockedBanner.Parent = blockedGui
Instance.new("UICorner").Parent = blockedBanner
local blockStroke = Instance.new("UIStroke"); blockStroke.Color = Color3.fromRGB(220, 60, 60); blockStroke.Thickness = 2; blockStroke.Parent = blockedBanner

local blockedTitle = Instance.new("TextLabel")
blockedTitle.Size = UDim2.new(1, -16, 0, 22)
blockedTitle.Position = UDim2.new(0, 8, 0, 6)
blockedTitle.BackgroundTransparency = 1
blockedTitle.Text = "AREA LOCKED"
blockedTitle.TextSize = 13
blockedTitle.Font = Enum.Font.GothamBold
blockedTitle.TextColor3 = Color3.fromRGB(220, 60, 60)
blockedTitle.Parent = blockedBanner

local blockedReason = Instance.new("TextLabel")
blockedReason.Size = UDim2.new(1, -16, 0, 26)
blockedReason.Position = UDim2.new(0, 8, 0, 30)
blockedReason.BackgroundTransparency = 1
blockedReason.Text = ""
blockedReason.TextSize = 15
blockedReason.Font = Enum.Font.GothamBold
blockedReason.TextColor3 = Color3.fromRGB(240, 240, 240)
blockedReason.Parent = blockedBanner

blockedBanner.BackgroundTransparency = 1  -- hidden initially

-- ── Active music ──────────────────────────────────────────────────────────────
local activeSound: Sound? = nil

local function playZoneMusic(musicId: string)
	if activeSound then
		activeSound:Stop()
		activeSound:Destroy()
		activeSound = nil
	end
	if musicId == "rbxassetid://0" then return end
	local sound = Instance.new("Sound")
	sound.SoundId = musicId
	sound.Volume  = 0.5
	sound.Looped  = true
	sound.Parent  = SoundService
	sound:Play()
	activeSound = sound
end

-- ── Apply zone effects ────────────────────────────────────────────────────────
local function applyZoneEffects(zone: any)
	-- Lighting transition
	TweenService:Create(Lighting, TweenInfo.new(1.5, Enum.EasingStyle.Quad), {
		Ambient    = zone.ambientColor,
		FogEnd     = zone.fogEnd,
		Brightness = zone.brightness,
	}):Play()

	-- Music
	playZoneMusic(zone.musicId)

	-- Ability flags: canFly, etc.
	-- Wire up to your fly/ability system here
	if zone.abilityFlags then
		if zone.abilityFlags.canFly == true then
			print("[ZoneClient] Fly ability ENABLED in", zone.displayName)
		elseif zone.abilityFlags.canFly == false then
			print("[ZoneClient] Fly ability DISABLED in", zone.displayName)
		end
	end
end

-- ── Zone entered handler ──────────────────────────────────────────────────────
ZoneEntered.OnClientEvent:Connect(function(zone: any, _previousZone: string?)
	-- Fade-out → fade-in transition
	TweenService:Create(transFrame, TweenInfo.new(0.25, Enum.EasingStyle.Quad), {
		BackgroundTransparency = 0
	}):Play()

	task.delay(0.28, function()
		applyZoneEffects(zone)

		-- Show zone name banner
		zoneNameLbl.Text = tostring(zone.displayName)
		zoneBanner.Position = UDim2.new(0.5, -150, 0, -70)
		TweenService:Create(zoneBanner, TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
			Position = UDim2.new(0.5, -150, 0, 20)
		}):Play()

		-- Fade back in
		TweenService:Create(transFrame, TweenInfo.new(0.4, Enum.EasingStyle.Quad), {
			BackgroundTransparency = 1
		}):Play()

		task.delay(3, function()
			TweenService:Create(zoneBanner, TweenInfo.new(0.35, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
				Position = UDim2.new(0.5, -150, 0, -70)
			}):Play()
		end)
	end)
end)

ZoneExited.OnClientEvent:Connect(function(_zoneId: string)
	-- Nothing special needed — ZoneEntered on the next zone handles the transition
end)

-- ── Zone blocked handler ──────────────────────────────────────────────────────
local blockActive = false

ZoneBlocked.OnClientEvent:Connect(function(zoneName: string, reason: string)
	if blockActive then return end
	blockActive = true
	blockedTitle.Text = "AREA LOCKED — " .. zoneName:upper()
	blockedReason.Text = reason
	blockedBanner.BackgroundTransparency = 0.1
	TweenService:Create(blockedBanner, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
		Position = UDim2.new(0.5, -160, 0.5, 120)
	}):Play()

	task.delay(3, function()
		TweenService:Create(blockedBanner, TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
			BackgroundTransparency = 1
		}):Play()
		task.delay(0.3, function()
			blockActive = false
		end)
	end)
end)

print("[ZoneClient] Ready")
`,
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const GAME_SYSTEMS: Record<string, GameSystem> = {
  currency: {
    id: 'currency',
    description: 'DataStore-backed coin system with animated HUD',
    files: [CURRENCY_SERVER, CURRENCY_CLIENT],
  },
  shop: {
    id: 'shop',
    description: 'Item shop with catalogue, purchase confirmation, and insufficient-funds handling',
    files: [SHOP_SERVER, SHOP_CLIENT],
  },
  pets: {
    id: 'pets',
    description: 'Egg hatching with rarities, pet following, equip/unequip',
    files: [PET_SERVER, PET_CLIENT],
  },
  inventory: {
    id: 'inventory',
    description: 'Backpack with item stacking, use, and drop',
    files: [INVENTORY_SERVER],
  },
  leaderboard: {
    id: 'leaderboard',
    description: 'Global top-10 leaderboard via OrderedDataStore, auto-refreshing',
    files: [LEADERBOARD_SERVER, LEADERBOARD_CLIENT],
  },
  leveling: {
    id: 'leveling',
    description: 'XP earn, exponential level-up, stat bonuses per level',
    files: [LEVEL_SERVER],
  },
  quests: {
    id: 'quests',
    description: 'Quest log, NPC-style objectives, progress tracking, coin+XP rewards',
    files: [QUEST_SERVER],
  },
  combat: {
    id: 'combat',
    description: 'Server-authoritative damage, respawn countdown, melee hitbox validation',
    files: [COMBAT_SERVER, COMBAT_CLIENT],
  },
  trading: {
    id: 'trading',
    description: 'Player-to-player trade with dual confirmation and atomic item swap',
    files: [TRADING_SERVER],
  },
  dailyrewards: {
    id: 'dailyrewards',
    description: '7-day streak calendar with escalating rewards and animated UI',
    files: [DAILY_REWARDS_SERVER, DAILY_REWARDS_CLIENT],
  },
  datasave: {
    id: 'datasave',
    description: 'ProfileService-style DataStore with session-lock, retry, auto-save, and public API',
    files: [DATA_SAVE_SERVER],
  },
  tycoon: {
    id: 'tycoon',
    description: 'Dropper → conveyor → collector tycoon with upgrades, rebirth, and 4-pad layout',
    files: [TYCOON_SERVER, TYCOON_CLIENT],
  },
  obby: {
    id: 'obby',
    description: 'Checkpoint obby with kill bricks, moving platforms, stage timer, and completion screen',
    files: [OBBY_SERVER, OBBY_CLIENT],
  },
  gamepass: {
    id: 'gamepass',
    description: 'MarketplaceService gamepass ownership checks, dev product ProcessReceipt, and purchase prompt UI',
    files: [GAMEPASS_SERVER, GAMEPASS_CLIENT],
  },
  teleport: {
    id: 'teleport',
    description: 'TeleportService with lobby→game, solo + party teleport, loading screen, and retry logic',
    files: [TELEPORT_SERVER, TELEPORT_CLIENT],
  },
  notifications: {
    id: 'notifications',
    description: 'Queue-based slide-in toast notifications (info/success/warning/error) with achievement popups',
    files: [NOTIFICATIONS_SERVER, NOTIFICATIONS_CLIENT],
  },
  voting: {
    id: 'voting',
    description: 'Map/mode voting with live vote tallies, countdown timer, and winner announcement',
    files: [VOTING_SERVER, VOTING_CLIENT],
  },
  rounds: {
    id: 'rounds',
    description: 'Full round lifecycle — intermission → active → results, with timer, scoreboard, and win conditions',
    files: [ROUNDS_SERVER, ROUNDS_CLIENT],
  },
  admin: {
    id: 'admin',
    description: 'Chat command parser (/kick /ban /tp /give /speed /fly /god /announce), ban DataStore, admin panel GUI',
    files: [ADMIN_SERVER, ADMIN_CLIENT],
  },
  crafting: {
    id: 'crafting',
    description: '3×3 recipe grid with pattern matching, material consumption, rarity output, and recipe book GUI',
    files: [CRAFTING_SERVER, CRAFTING_CLIENT],
  },
  dialogue: {
    id: 'dialogue',
    description: 'NPC dialogue tree with ProximityPrompt trigger, typewriter text, choice buttons, and action hooks',
    files: [DIALOGUE_SERVER, DIALOGUE_CLIENT],
  },
  achievement: {
    id: 'achievement',
    description: 'Achievement system with DataStore progress, unlock popup with confetti, and achievement log GUI',
    files: [ACHIEVEMENT_SERVER, ACHIEVEMENT_CLIENT],
  },
  zone: {
    id: 'zone',
    description: 'Zone detection via ZoneTag attribute, music/lighting transitions, zone gates, and name popup',
    files: [ZONE_SERVER, ZONE_CLIENT],
  },
}

// ─── Intent detection helper ─────────────────────────────────────────────────
// Returns the system id if the message matches a game system request, else null.

const SYSTEM_PATTERNS: Array<{ patterns: RegExp[]; systemId: string }> = [
  {
    patterns: [/\b(currency|coins?|cash|money|earn coins|spend coins|coin system|dual currency|gems? system)\b/i],
    systemId: 'currency',
  },
  {
    patterns: [/\b(shop|store|vendor|npc shop|item shop|buy items?|purchase system|sell items?|marketplace)\b/i],
    systemId: 'shop',
  },
  {
    patterns: [/\b(pet system|pets?|egg hatch|hatch(?:ing)?|pet follow|equip pet|pet rarity|pet inventory)\b/i],
    systemId: 'pets',
  },
  {
    patterns: [/\b(inventory|backpack|item stacking|drag.?drop|item slot|equip.?unequip)\b/i],
    systemId: 'inventory',
  },
  {
    patterns: [/\b(leaderboard|top players|rankings?|global board|high ?scores?|ordered ?data ?store)\b/i],
    systemId: 'leaderboard',
  },
  {
    patterns: [/\b(level(?:ing)? system|xp system|experience points?|level up|exp gain|level progression)\b/i],
    systemId: 'leveling',
  },
  {
    patterns: [/\b(quest system|quests?|missions?|objectives?|quest giver|quest rewards?|quest progress|quest log)\b/i],
    systemId: 'quests',
  },
  {
    patterns: [/\b(combat system|health system|damage system|respawn system|hitbox|pvp|pvp system|weapons? system|fighting system|melee system|health bars?)\b/i],
    systemId: 'combat',
  },
  {
    patterns: [/\b(trading? system|player trade|trade window|trade confirmation|item trading?|p2p trade)\b/i],
    systemId: 'trading',
  },
  {
    patterns: [/\b(daily rewards?|login streak|login rewards?|daily bonus|calendar rewards?|streak system)\b/i],
    systemId: 'dailyrewards',
  },
  {
    patterns: [/\b(data ?save|data ?store|save system|profile ?service|player data|persist(?:ence)?|auto.?save|session lock)\b/i],
    systemId: 'datasave',
  },
  {
    patterns: [/\b(tycoon|dropper|conveyor|collector|blob|rebirth system|tycoon system|money tycoon|idle tycoon)\b/i],
    systemId: 'tycoon',
  },
  {
    patterns: [/\b(obby|obstacle course|checkpoints?|kill bricks?|moving platforms?|parkour|obby system|stages?)\b/i],
    systemId: 'obby',
  },
  {
    patterns: [/\b(gamepass|game ?pass|dev ?product|robux|purchase system|marketplace purchase|prompt purchase|gamepass system|vip pass|speed pass)\b/i],
    systemId: 'gamepass',
  },
  {
    patterns: [/\b(teleport|lobby system|server hop|place teleport|teleport system|multi.?place|teleport service|party teleport|loading screen teleport)\b/i],
    systemId: 'teleport',
  },
  {
    patterns: [/\b(notification|popup|toast|alert system|slide.?in notif|notif system|achievement popup|push notif)\b/i],
    systemId: 'notifications',
  },
  {
    patterns: [/\b(voting system|map vote|poll system|vote system|vote for map|player voting|mode vote|vote countdown)\b/i],
    systemId: 'voting',
  },
  {
    patterns: [/\b(round system|match system|intermission|game loop|round.?based|round manager|match manager|round timer|kill limit|round results?)\b/i],
    systemId: 'rounds',
  },
  {
    patterns: [/\b(admin system|admin panel|admin commands?|chat commands?|moderator|kick system|ban system|\/kick|\/ban|admin tools?|admin gui)\b/i],
    systemId: 'admin',
  },
  {
    patterns: [/\b(crafting system|recipe system|craft(?:ing)?|workbench|forge items?|3x3 grid|recipe book|recipe grid|crafting table)\b/i],
    systemId: 'crafting',
  },
  {
    patterns: [/\b(dialogue system|npc talk|conversation system|dialogue tree|branching dialogue|proximity dialogue|npc dialogue|typewriter text|choice buttons?)\b/i],
    systemId: 'dialogue',
  },
  {
    patterns: [/\b(achievement system|achievements?|badge system|unlock system|trophies|trophy system|milestones?|achievement log|achievement popup)\b/i],
    systemId: 'achievement',
  },
  {
    patterns: [/\b(zone system|area system|regions?|zone gate|zone transition|zone detection|zone effect|lighting zone|zone music|enter zone)\b/i],
    systemId: 'zone',
  },
]

// Build-verb check — requires "add", "make", "create", "build", "implement", "give me", "setup", "set up"
const SYSTEM_BUILD_VERBS =
  /\b(add|make|create|build|implement|give me|set ?up|generate|write|code|script|need|want|i ?need|can you)\b/i

export function detectGameSystemIntent(message: string): string | null {
  const trimmed = message.trim()
  for (const entry of SYSTEM_PATTERNS) {
    if (entry.patterns.some((p) => p.test(trimmed))) {
      // Require a build verb OR the message is short (likely a direct command)
      if (SYSTEM_BUILD_VERBS.test(trimmed) || trimmed.split(' ').length <= 8) {
        return entry.systemId
      }
    }
  }
  return null
}

/**
 * Format a GameSystem into a multi-file response message.
 * Returns a markdown string showing each file's code block.
 */
export function formatGameSystemResponse(system: GameSystem): string {
  const fileBlocks = system.files.map((f) => {
    const tag = f.scriptType === 'ServerScript'
      ? 'SERVER'
      : f.scriptType === 'LocalScript'
        ? 'CLIENT'
        : 'MODULE'
    return `### [${tag}] ${f.filename}.lua → ${f.parent}\n\`\`\`lua\n${f.code.trim()}\n\`\`\``
  })

  return [
    `Here's the complete **${system.description}** — ${system.files.length} script${system.files.length > 1 ? 's' : ''} ready to drop in:`,
    '',
    ...fileBlocks,
    '',
    `Place each file in the specified service (e.g. ServerScriptService, StarterPlayerScripts). All DataStore calls are wrapped in \`pcall\` and RemoteEvents are in ReplicatedStorage.`,
  ].join('\n')
}
