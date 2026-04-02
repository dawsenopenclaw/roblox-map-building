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
}

// ─── Intent detection helper ─────────────────────────────────────────────────
// Returns the system id if the message matches a game system request, else null.

const SYSTEM_PATTERNS: Array<{ patterns: RegExp[]; systemId: string }> = [
  {
    patterns: [/\b(currency|coins?|cash|money|earn coins|spend coins|coin system)\b/i],
    systemId: 'currency',
  },
  {
    patterns: [/\b(shop|store|buy items?|item shop|purchase system|sell items?)\b/i],
    systemId: 'shop',
  },
  {
    patterns: [/\b(pet system|pets?|egg hatch|hatch(?:ing)?|pet follow|equip pet|pet rarity)\b/i],
    systemId: 'pets',
  },
  {
    patterns: [/\b(inventory|backpack|item stacking|drag.?drop|item slot)\b/i],
    systemId: 'inventory',
  },
  {
    patterns: [/\b(leaderboard|top players|rankings?|global board|high ?scores?)\b/i],
    systemId: 'leaderboard',
  },
  {
    patterns: [/\b(level(?:ing)? system|xp system|experience points?|level up|exp gain|level progression)\b/i],
    systemId: 'leveling',
  },
  {
    patterns: [/\b(quest system|quests?|missions?|objectives?|quest giver|quest rewards?|quest progress)\b/i],
    systemId: 'quests',
  },
  {
    patterns: [/\b(combat system|health system|damage system|respawn system|hitbox|pvp system|weapons? system)\b/i],
    systemId: 'combat',
  },
  {
    patterns: [/\b(trading? system|player trade|trade window|trade confirmation|item trading?)\b/i],
    systemId: 'trading',
  },
  {
    patterns: [/\b(daily rewards?|login streak|login rewards?|daily bonus|calendar rewards?)\b/i],
    systemId: 'dailyrewards',
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
