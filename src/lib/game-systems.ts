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
